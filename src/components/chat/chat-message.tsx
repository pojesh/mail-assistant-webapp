"use client";

import { AlertTriangle, Check, ChevronDown, Loader2, Mail, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { ChatTurn } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

/** The tools the assistant used, live while it works and collapsible afterwards. */
function StepTimeline({ turn }: { turn: ChatTurn }) {
  const [open, setOpen] = useState(false);
  const working = turn.status === "streaming";
  if (turn.steps.length === 0 && !working) return null;
  const visible = working || open;
  return (
    <div className="mb-2">
      {!working && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {turn.steps.length} step{turn.steps.length === 1 ? "" : "s"}
          <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        </button>
      )}
      <AnimatePresence initial={false}>
        {visible && (
          <motion.ol
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1 border-l pl-3"
            aria-live="polite"
          >
            {turn.steps.map((step, index) => {
              const current = working && index === turn.steps.length - 1 && !turn.content;
              return (
                <motion.li
                  key={`${step.tool}-${index}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  {current ? (
                    <Loader2 className="size-3 animate-spin text-primary" />
                  ) : (
                    <Check className="size-3 text-success" />
                  )}
                  {step.label}
                </motion.li>
              );
            })}
            {working && turn.steps.length === 0 && (
              <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin text-primary" /> Thinking…
              </li>
            )}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}

function Citations({ turn }: { turn: ChatTurn }) {
  if (turn.citations.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {turn.citations.map((citation) => {
        const chip = (
          <>
            <Mail className="size-3 shrink-0" />
            <span className="truncate">{citation.subject}</span>
          </>
        );
        const className =
          "inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs transition-colors";
        return citation.email_id ? (
          <Link
            key={citation.thread_id}
            href={`/inbox/${citation.email_id}`}
            className={cn(className, "hover:border-primary/40 hover:text-primary")}
          >
            {chip}
          </Link>
        ) : (
          <span
            key={citation.thread_id}
            className={cn(className, "text-muted-foreground")}
            title="Not in your synced inbox"
          >
            {chip}
          </span>
        );
      })}
    </div>
  );
}

/** One message. Assistant answers render Markdown (no raw HTML) with a typing cursor while streaming. */
export function ChatMessage({ turn }: { turn: ChatTurn }) {
  if (turn.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground shadow-sm">
          {turn.content}
        </p>
      </motion.div>
    );
  }
  const error = turn.status === "error";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          error
            ? "bg-destructive/10 text-destructive"
            : "bg-gradient-to-br from-primary to-[oklch(0.6_0.22_300)] text-primary-foreground",
        )}
        aria-hidden
      >
        {error ? <AlertTriangle className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <StepTimeline turn={turn} />
        {turn.content && (
          <div
            className={cn(
              "prose-chat max-w-none leading-relaxed [&_a]:text-primary [&_a]:underline [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5",
              error && "text-destructive",
            )}
          >
            <ReactMarkdown>{turn.content}</ReactMarkdown>
            {turn.status === "streaming" && (
              <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-primary" />
            )}
          </div>
        )}
        <Citations turn={turn} />
      </div>
    </motion.div>
  );
}
