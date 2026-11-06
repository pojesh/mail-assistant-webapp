"use client";

import { CalendarCheck2, Check, PenLine, Sparkles } from "lucide-react";
import { motion } from "motion/react";

import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const ROWS = [
  {
    from: "Priya Shah",
    subject: "Q3 report review",
    summary: "Wants your comments on the Q3 report by Friday.",
    category: "action_required",
    time: "09:42",
  },
  {
    from: "Arun Mehta",
    subject: "Sync next week?",
    summary: "Asks for 30 minutes to catch up on the integration.",
    category: "meeting_request",
    time: "09:15",
  },
  {
    from: "IndiGo",
    subject: "Booking confirmed",
    summary: "Your BLR to DEL flight on 14 Nov is confirmed.",
    category: "fyi",
    time: "Mon",
  },
  {
    from: "TLDR Tech",
    subject: "New GPU announced",
    summary: "Daily tech newsletter.",
    category: "newsletter",
    time: "Mon",
  },
] as const;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

/** An illustrative inbox: rows slide in with their AI chips, then the assistant acts. */
export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="absolute -inset-x-10 -inset-y-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/25 via-[oklch(0.7_0.15_300)]/15 to-transparent blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur"
      >
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted-foreground">Inbox · triaged by AI</span>
        </div>
        <ul className="divide-y">
          {ROWS.map((row, index) => {
            const category = CATEGORIES[row.category];
            const Icon = category.icon;
            return (
              <motion.li
                key={row.subject}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.12, duration: 0.4 }}
                className={cn("flex items-start gap-3 px-4 py-3 text-left", index === 0 && "bg-accent/50")}
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {initialsOf(row.from)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{row.from}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                        category.className,
                      )}
                    >
                      <Icon className="size-3" /> {category.label}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{row.time}</span>
                  </div>
                  <p className="truncate text-[13px] text-foreground/80">{row.subject}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Sparkles className="size-3 shrink-0 text-primary" /> {row.summary}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
        <div className="grid gap-2 border-t bg-muted/40 p-3 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-xs"
          >
            <PenLine className="size-3.5 shrink-0 text-primary" />
            <span className="flex-1">Reply to Priya drafted in your tone</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">Review</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35 }}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-xs"
          >
            <CalendarCheck2 className="size-3.5 shrink-0 text-success" />
            <span className="flex-1">Tue 10:00 offered to Arun, fits your rules</span>
            <Check className="size-3.5 text-success" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
