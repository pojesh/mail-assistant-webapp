"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  CalendarClock,
  ChevronDown,
  Loader2,
  PenLine,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EmptyState, ErrorState, Shimmer } from "@/components/common/states";
import { useUndoAction } from "@/components/shell/notification-bell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { fullDateTime, timeAgo } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type Item = Schemas["ActivityItem"];

const ACTORS: Record<string, { icon: LucideIcon; label: string }> = {
  guardrail: { icon: ShieldCheck, label: "Safety check" },
  triage: { icon: Sparkles, label: "Triage" },
  labeler: { icon: Tag, label: "Gmail labels" },
  retrieval: { icon: Search, label: "Context" },
  drafting: { icon: PenLine, label: "Drafting" },
  scheduling: { icon: CalendarClock, label: "Scheduling" },
  validator: { icon: ShieldCheck, label: "Rule check" },
  autonomy: { icon: Zap, label: "Auto-scheduling" },
  executor: { icon: Bot, label: "Action" },
  approvals: { icon: Activity, label: "Approvals" },
  memory: { icon: Sparkles, label: "Learning" },
  user: { icon: User, label: "You" },
  pipeline: { icon: Bot, label: "Pipeline" },
};

const STATUS_STYLES: Record<Item["status"], string> = {
  ok: "bg-muted text-muted-foreground",
  auto: "bg-success/15 text-success",
  blocked: "bg-warning/15 text-warning",
  error: "bg-destructive/15 text-destructive",
};

const humanise = (text: string) => text.replaceAll("_", " ");

function DetailText({ detail }: { detail: Item["detail"] }) {
  const entries = Object.entries(detail).filter(
    ([, value]) => value !== null && value !== "" && !(Array.isArray(value) && value.length === 0),
  );
  if (entries.length === 0) return <p className="text-xs text-muted-foreground">No extra details.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{humanise(key)}</dt>
          <dd className="break-words font-mono text-[11px]">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ActivityRow({ item, index }: { item: Item; index: number }) {
  const [open, setOpen] = useState(false);
  const undo = useUndoAction();
  const actor = ACTORS[item.actor] ?? { icon: Bot, label: humanise(item.actor) };
  const Icon = actor.icon;
  const canUndo = item.undo_action_id && item.undo_until && new Date(item.undo_until) > new Date();
  const reason = typeof item.detail.reason === "string" ? item.detail.reason : null;
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 20) * 0.015 }}
      className="relative pl-10"
    >
      <span
        className={cn(
          "absolute left-0 top-1 flex size-7 items-center justify-center rounded-full ring-4 ring-background",
          item.status === "auto" ? "bg-success text-white" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div
        className={cn(
          "rounded-xl border bg-card px-4 py-3",
          item.status === "auto" && "border-success/30 bg-success/[0.04]",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-start gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13px]">
              <span className="font-medium">{actor.label}</span> · {humanise(item.action)}
              {item.tool && <span className="text-muted-foreground"> via {item.tool}</span>}
            </p>
            {reason && <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p>}
          </div>
          <Badge className={cn("shrink-0 capitalize", STATUS_STYLES[item.status])}>
            {item.status === "auto" ? "automatic" : item.status}
          </Badge>
          <time
            className="shrink-0 text-xs text-muted-foreground"
            dateTime={item.created_at}
            title={fullDateTime(item.created_at)}
          >
            {timeAgo(item.created_at)}
          </time>
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3 border-t pt-3">
                <DetailText detail={item.detail} />
                {item.email_id && (
                  <Link
                    href={`/inbox/${item.email_id}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open the email
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {canUndo && (
          <Button
            size="xs"
            variant="outline"
            className="mt-2"
            disabled={undo.isPending}
            onClick={() => undo.mutate(item.undo_action_id as string)}
          >
            <RotateCcw /> Undo
          </Button>
        )}
      </div>
    </motion.li>
  );
}

/** Every step the assistant took: which agent, what, with which tool, and the outcome. */
export function ActivityPage() {
  const activity = useInfiniteQuery({
    queryKey: queryKeys.activity,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(api.GET("/api/activity", { params: { query: { cursor: pageParam, limit: 50 } } })),
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = activity;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = activity.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
          <p className="text-muted-foreground">
            A record of every step the assistant took. Automatic actions are highlighted.
          </p>
        </header>
        {activity.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Shimmer key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : activity.isError ? (
          <ErrorState onRetry={() => void activity.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            text="Steps appear here as new mail is processed."
          />
        ) : (
          <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-3.5 before:top-2 before:w-px before:bg-border">
            {items.map((item, index) => (
              <ActivityRow key={item.id} item={item} index={index} />
            ))}
          </ol>
        )}
        <div ref={sentinel} className="flex h-10 items-center justify-center">
          {isFetchingNextPage && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}
