"use client";

import { useQuery } from "@tanstack/react-query";
import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderSearch,
  Presentation,
  Search,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, Shimmer } from "@/components/common/states";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { fileSize, listTime, senderName } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

type Attachment = Schemas["AttachmentItem"];

type FileKind = "image" | "sheet" | "slides" | "archive" | "document" | "other";

function fileKind(mime: string, name: string): FileKind {
  const lower = `${mime} ${name}`.toLowerCase();
  if (lower.includes("image")) return "image";
  if (/sheet|excel|csv|\.xls/.test(lower)) return "sheet";
  if (/presentation|powerpoint|\.ppt|keynote/.test(lower)) return "slides";
  if (/zip|rar|7z|compressed/.test(lower)) return "archive";
  if (/pdf|word|document|text/.test(lower)) return "document";
  return "other";
}

/** An icon for the file type (a fixed element per kind, so nothing is created during render). */
function FileTypeIcon({ kind }: { kind: FileKind }) {
  const className = "size-4";
  switch (kind) {
    case "image":
      return <FileImage className={className} />;
    case "sheet":
      return <FileSpreadsheet className={className} />;
    case "slides":
      return <Presentation className={className} />;
    case "archive":
      return <FileArchive className={className} />;
    case "document":
      return <FileText className={className} />;
    default:
      return <File className={className} />;
  }
}

function useDebounced(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function FileName({ item }: { item: Attachment }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileTypeIcon kind={fileKind(item.mime_type, item.filename)} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{item.filename}</span>
        <span className="block truncate text-xs text-muted-foreground sm:hidden">
          {senderName(item.sender_name, item.sender_email)} · {fileSize(item.size_bytes)}
        </span>
      </span>
    </span>
  );
}

/** Attachment metadata (never the files themselves), searchable by name, sender or subject. */
export function FilesPage() {
  const [text, setText] = useState("");
  const query = useDebounced(text.trim());
  const files = useQuery({
    queryKey: queryKeys.attachments(query),
    queryFn: () =>
      unwrap(api.GET("/api/attachments", { params: { query: { q: query || undefined, limit: 100 } } })),
    placeholderData: (previous) => previous,
  });

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
        <header className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
            <p className="text-muted-foreground">
              Every attachment in your synced mail. Search by file name, sender or subject.
            </p>
          </div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="e.g. invoice pdf ravi"
              aria-label="Search files"
              className="h-10 pl-9 pr-9"
            />
            {text && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </header>

        {files.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Shimmer key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : files.isError ? (
          <ErrorState onRetry={() => void files.refetch()} />
        ) : files.data.length === 0 ? (
          <EmptyState
            icon={FolderSearch}
            title={query ? "No files match" : "No attachments yet"}
            text={
              query
                ? "Try part of the file name, or the sender's name."
                : "Attachments appear here as your mail is synced."
            }
          />
        ) : (
          <div className={files.isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">From</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Size</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.data.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index, 15) * 0.015 }}
                    className="group border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="max-w-[16rem] sm:max-w-xs">
                      <Link href={`/inbox/${item.email_id}`} className="outline-none focus-visible:underline">
                        <FileName item={item} />
                      </Link>
                    </TableCell>
                    <TableCell className="hidden max-w-[12rem] truncate sm:table-cell">
                      {senderName(item.sender_name, item.sender_email)}
                    </TableCell>
                    <TableCell className="hidden max-w-[16rem] truncate text-muted-foreground md:table-cell">
                      {item.subject}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                      {fileSize(item.size_bytes)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {listTime(item.received_at)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Only file names and details are stored. Open the email to download a file from Gmail.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
