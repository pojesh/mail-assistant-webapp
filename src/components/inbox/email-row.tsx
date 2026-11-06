"use client";

import { CalendarClock, Paperclip, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { forwardRef } from "react";

import { CategoryChip, PriorityDots, SentimentChip, SuspiciousChip } from "@/components/email/chips";
import type { Schemas } from "@/lib/api/client";
import { listTime, senderName } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = { email: Schemas["EmailListItem"]; href: string; selected: boolean; index: number };

/** One inbox row: sender, subject, AI summary, chips, priority, time and attachment/invite icons. */
export const EmailRow = forwardRef<HTMLAnchorElement, Props>(function EmailRow(
  { email, href, selected, index },
  ref,
) {
  const insight = email.insight;
  const showSentiment = insight && insight.sentiment !== "neutral" && insight.sentiment !== "positive";
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.02 }}
      className="relative"
    >
      {selected && (
        <motion.span
          layoutId="inbox-selected"
          className="absolute inset-x-1.5 inset-y-0.5 -z-10 rounded-lg bg-accent ring-1 ring-primary/15"
          transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
        />
      )}
      <Link
        ref={ref}
        href={href}
        scroll={false}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "group mx-1.5 my-0.5 flex gap-3 rounded-lg px-3 py-2.5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
          !selected && "hover:bg-muted/60",
        )}
      >
        <span className="mt-1.5 flex w-2 shrink-0 justify-center">
          {email.is_unread && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn("truncate", email.is_unread ? "font-semibold" : "font-medium text-foreground/85")}
            >
              {senderName(email.from_name, email.from_email)}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              {email.has_invite && <CalendarClock className="size-3.5" aria-label="Calendar invite" />}
              {email.has_attachments && <Paperclip className="size-3.5" aria-label="Has attachments" />}
              <time dateTime={email.received_at}>{listTime(email.received_at)}</time>
            </span>
          </div>
          <p
            className={cn("truncate text-[13px]", email.is_unread ? "text-foreground" : "text-foreground/75")}
          >
            {email.subject || "(no subject)"}
          </p>
          {insight ? (
            <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 size-3 shrink-0 text-primary/80" aria-hidden />
              <span className="line-clamp-2">{insight.summary}</span>
            </p>
          ) : (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{email.snippet}</p>
          )}
          {insight && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {insight.suspicious && <SuspiciousChip />}
              <CategoryChip category={insight.category} />
              {showSentiment && <SentimentChip sentiment={insight.sentiment} />}
              <PriorityDots priority={insight.priority} className="ml-auto" />
            </div>
          )}
        </div>
      </Link>
    </motion.li>
  );
});
