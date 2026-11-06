"use client";

import { CalendarSearch, CheckCircle2, Circle, Loader2, PenLine, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { CategoryChip, PriorityDots, SentimentChip } from "@/components/email/chips";
import { isTyping } from "@/components/inbox/email-list";
import { SchedulingCard } from "@/components/inbox/scheduling-card";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useStartFlow } from "@/hooks/use-emails";
import type { Schemas } from "@/lib/api/client";
import { SENTIMENTS } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Detail = Schemas["EmailDetail"];

function SuspiciousCard({ reasons }: { reasons: string[] }) {
  return (
    <section role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <p className="flex items-center gap-2 font-semibold text-destructive">
        <ShieldAlert className="size-4" /> This email looks suspicious
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        It seems to contain instructions aimed at an AI. Automatic drafting and scheduling are turned off for
        it.
      </p>
      {reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionItems({ items }: { items: Schemas["ActionItem"][] }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Action items
      </h3>
      <ul className="space-y-1">
        {items.map((item, index) => {
          const checked = done.has(index);
          return (
            <li key={item.task}>
              <button
                type="button"
                onClick={() =>
                  setDone((previous) => {
                    const next = new Set(previous);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  })
                }
                className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted"
                aria-pressed={checked}
              >
                {checked ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn("flex-1", checked && "text-muted-foreground line-through")}>
                  {item.task}
                </span>
                {item.due && (
                  <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning">
                    Due {new Date(item.due).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Buttons for "Draft reply" (d) and "Find a time" (t). */
function FlowButtons({ email }: { email: Detail }) {
  const flow = useStartFlow(email.id);
  const disabled = flow.isPending || !!email.insight?.suspicious;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || disabled) return;
      if (event.key === "d") flow.mutate("draft");
      if (event.key === "t") flow.mutate("schedule");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flow, disabled]);

  const pending = flow.isPending ? flow.variables : null;
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button onClick={() => flow.mutate("draft")} disabled={disabled}>
        {pending === "draft" ? <Loader2 className="animate-spin" /> : <PenLine />} Draft reply <Kbd>D</Kbd>
      </Button>
      <Button variant="outline" onClick={() => flow.mutate("schedule")} disabled={disabled}>
        {pending === "schedule" ? <Loader2 className="animate-spin" /> : <CalendarSearch />} Find a time{" "}
        <Kbd>T</Kbd>
      </Button>
      {flow.isPending && (
        <p className="col-span-2 animate-fade-up text-center text-xs text-muted-foreground">
          The assistant is working on it. This can take up to a minute on the free AI tier.
        </p>
      )}
    </div>
  );
}

/** Everything the AI found about this email. */
export function AiPanel({ email }: { email: Detail }) {
  const insight = email.insight;
  if (!insight) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed p-4 text-[13px] text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="size-4 text-primary" /> Not triaged yet
          </p>
          <p className="mt-1">The AI will analyse this email on the next sync.</p>
        </div>
        <FlowButtons email={email} />
      </div>
    );
  }
  const sentiment = SENTIMENTS[insight.sentiment];
  return (
    <div className="space-y-5">
      {insight.suspicious && <SuspiciousCard reasons={insight.suspicious_reasons} />}
      <section className="rounded-xl border bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="size-3.5" /> AI summary
        </p>
        <p className="leading-relaxed">{insight.summary}</p>
        {insight.thread_summary && (
          <p className="mt-2 text-[13px] text-muted-foreground">{insight.thread_summary}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CategoryChip category={insight.category} />
          <SentimentChip sentiment={insight.sentiment} />
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            Priority <PriorityDots priority={insight.priority} />
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {sentiment.label} tone, {Math.round(insight.sentiment_score * 100)}% confident
          {insight.needs_reply ? " · waiting for your reply" : ""}
        </p>
      </section>
      {email.scheduling && <SchedulingCard info={email.scheduling} />}
      <ActionItems items={insight.action_items} />
      {!insight.suspicious && <FlowButtons email={email} />}
      <p className="text-[11px] text-muted-foreground/80">
        Analysed by {insight.model} ({insight.provider}). AI can make mistakes; nothing is sent without your
        approval.
      </p>
    </div>
  );
}
