"use client";

import { ArrowLeft, ChevronDown, FileText, Paperclip } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { EmptyState, ErrorState, Shimmer } from "@/components/common/states";
import { AiPanel } from "@/components/inbox/ai-panel";
import { EmailBody } from "@/components/inbox/email-body";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEmail } from "@/hooks/use-emails";
import { ApiError, type Schemas } from "@/lib/api/client";
import { fileSize, fullDateTime, initials, senderName } from "@/lib/format";
import { cn } from "@/lib/utils";

type Detail = Schemas["EmailDetail"];

function Attachments({ items }: { items: Schemas["AttachmentItem"][] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Attachments" className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Paperclip className="size-3.5" /> {items.length} attachment{items.length === 1 ? "" : "s"}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
            <FileText className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{item.filename}</p>
              <p className="text-xs text-muted-foreground">
                {fileSize(item.size_bytes)} · {item.mime_type.split("/").pop()}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Open attachments from Gmail. The assistant never downloads them.
      </p>
    </section>
  );
}

function Thread({ messages }: { messages: Schemas["ThreadMessage"][] }) {
  const [open, setOpen] = useState(false);
  if (messages.length === 0) return null;
  return (
    <section className="rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-medium"
      >
        {messages.length} other message{messages.length === 1 ? "" : "s"} in this conversation
        <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="divide-y border-t"
        >
          {messages.map((message) => (
            <li key={message.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium">
                  {message.is_sent ? "You" : senderName(message.from_name, message.from_email)}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {fullDateTime(message.received_at)}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{message.snippet}</p>
            </li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}

function Header({ email, backHref }: { email: Detail; backHref: string }) {
  const name = senderName(email.from_name, email.from_email);
  return (
    <header className="space-y-4">
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="icon-sm" asChild className="-ml-1 lg:hidden">
          <Link href={backHref} aria-label="Back to inbox">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-balance text-xl font-semibold tracking-tight">
          {email.subject || "(no subject)"}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {name} <span className="font-normal text-muted-foreground">&lt;{email.from_email}&gt;</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            to {email.to.join(", ") || "you"}
            {email.cc.length > 0 && `, cc ${email.cc.join(", ")}`}
          </p>
        </div>
        <time className="shrink-0 text-xs text-muted-foreground" dateTime={email.received_at}>
          {fullDateTime(email.received_at)}
        </time>
      </div>
    </header>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5 p-6" aria-busy>
      <Shimmer className="h-6 w-2/3" />
      <div className="flex gap-3">
        <Shimmer className="size-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3.5 w-48" />
          <Shimmer className="h-3 w-32" />
        </div>
      </div>
      <Shimmer className="h-72 w-full rounded-xl" />
    </div>
  );
}

/** The open email: header, body, attachments and thread, with the AI panel alongside. */
export function EmailDetailView({ id }: { id: string }) {
  const email = useEmail(id);
  const search = useSearchParams().toString();
  const backHref = search ? `/inbox?${search}` : "/inbox";

  if (email.isPending) return <DetailSkeleton />;
  if (email.isError) {
    if (email.error instanceof ApiError && email.error.status === 404)
      return <EmptyState icon={FileText} title="Email not found" text="It may have been deleted." />;
    return <ErrorState onRetry={() => void email.refetch()} />;
  }
  const data = email.data;
  return (
    <motion.div
      key={data.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex h-full min-h-0 flex-col 2xl:flex-row"
    >
      <article className="scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <Header email={data} backHref={backHref} />
        <div className="2xl:hidden">
          <AiPanel email={data} />
        </div>
        <EmailBody html={data.body_html} text={data.body_text} />
        <Attachments items={data.attachments} />
        <Thread messages={data.thread} />
      </article>
      <aside
        aria-label="AI assistant"
        className="scrollbar-thin hidden w-[22rem] shrink-0 overflow-y-auto border-l bg-muted/20 p-5 2xl:block"
      >
        <AiPanel email={data} />
      </aside>
    </motion.div>
  );
}
