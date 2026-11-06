"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckSquare, ChevronDown, Mail, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboard } from "@/hooks/use-app-data";
import { api, unwrap } from "@/lib/api/client";
import { SENTIMENTS, type Sentiment } from "@/lib/categories";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "inbox-dashboard-collapsed";
const SENTIMENT_ORDER: Sentiment[] = ["urgent", "frustrated", "negative", "neutral", "positive"];

/** Remember collapsed/expanded on this device (browser storage may be unavailable). */
function useCollapsed(): [boolean, (value: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount (storage is client-only)
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* storage blocked: keep the default */
    }
  }, []);
  const update = (value: boolean) => {
    setCollapsed(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  };
  return [collapsed, update];
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: typeof Mail;
  label: string;
  value: number;
  href?: string;
  tone?: string;
}) {
  const body = (
    <>
      <span className={cn("flex size-7 items-center justify-center rounded-lg bg-muted", tone)}>
        <Icon className="size-3.5" />
      </span>
      <span>
        <span className="block text-base font-semibold tabular-nums leading-tight">{value}</span>
        <span className="block text-[11px] text-muted-foreground">{label}</span>
      </span>
    </>
  );
  const className = "flex items-center gap-2 rounded-xl border bg-card px-3 py-2 transition-colors";
  return href ? (
    <Link href={href} className={cn(className, "hover:border-primary/30")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function SentimentBar({ counts }: { counts: Record<string, number> }) {
  const total = SENTIMENT_ORDER.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  if (total === 0) return null;
  return (
    <div className="min-w-40 flex-1">
      <p className="mb-1.5 text-[11px] text-muted-foreground">Mood of the last 7 days</p>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label="Sentiment breakdown"
      >
        {SENTIMENT_ORDER.map((key) => {
          const count = counts[key] ?? 0;
          if (!count) return null;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / total) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn("h-full", SENTIMENTS[key].dot)}
                />
              </TooltipTrigger>
              <TooltipContent>
                {SENTIMENTS[key].label}: {count}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

/** Collapsible overview at the top of the inbox: digest headline, counts and mood. */
export function DashboardStrip() {
  const dashboard = useDashboard();
  const digest = useQuery({
    queryKey: queryKeys.digest,
    queryFn: () => unwrap(api.GET("/api/digest/today")),
  });
  const [collapsed, setCollapsed] = useCollapsed();
  const data = dashboard.data;
  if (!data) return null;

  return (
    <section aria-label="Overview" className="border-b bg-gradient-to-b from-primary/[0.04] to-transparent">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px]"
      >
        <Sparkles className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate">
          {digest.data?.headline ??
            `${data.total} emails this week · ${data.pending_approvals} waiting for you`}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            collapsed && "-rotate-90",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-2 px-4 pb-3">
              <Stat icon={Mail} label={`emails · ${data.unread} unread`} value={data.total} />
              <Stat
                icon={CheckSquare}
                label="waiting for approval"
                value={data.pending_approvals}
                href="/approvals"
                tone="text-primary"
              />
              <Stat
                icon={Zap}
                label="automatic today"
                value={data.auto_actions_today}
                href="/activity"
                tone="text-success"
              />
              {data.suspicious > 0 && (
                <Stat icon={ShieldAlert} label="suspicious" value={data.suspicious} tone="text-destructive" />
              )}
              <SentimentBar counts={data.by_sentiment} />
            </div>
            {digest.data?.summary && (
              <p className="px-4 pb-3 text-[13px] text-muted-foreground">{digest.data.summary}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
