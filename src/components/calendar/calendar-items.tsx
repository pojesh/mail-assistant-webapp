"use client";

import { CalendarClock, ExternalLink, RotateCcw, Sparkles, Users, Video } from "lucide-react";
import Link from "next/link";

import { useUndoAction } from "@/components/shell/notification-bell";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Schemas } from "@/lib/api/client";
import { timeRange } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AgendaEvent = Schemas["AgendaEvent"];
export type Proposal = Schemas["ProposedEvent"];

const RESPONSE_LABELS: Record<string, string> = {
  accepted: "Going",
  tentative: "Maybe",
  declined: "Declined",
  needsAction: "Not answered yet",
};

/** Visual style of an event box (used in the grid and the agenda list). */
export function eventTone(event: AgendaEvent): string {
  if (event.my_response === "declined") return "border-border bg-muted/40 text-muted-foreground line-through";
  if (event.my_response === "needsAction")
    return "border-dashed border-primary/50 bg-background text-foreground";
  if (event.auto_added) return "border-success/40 bg-success/10 text-foreground";
  return "border-primary/25 bg-primary/10 text-foreground";
}

export function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-success/20 px-1 text-[10px] font-semibold text-success">
      <Sparkles className="size-2.5" /> AI
    </span>
  );
}

/** Details for one event, with Undo for things the assistant did automatically. */
export function EventPopover({ event, children }: { event: AgendaEvent; children: React.ReactNode }) {
  const undo = useUndoAction();
  const canUndo =
    event.auto_added && event.action_id && event.undo_until && new Date(event.undo_until) > new Date();
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            {event.summary || "(no title)"} {event.auto_added && <AiBadge />}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {event.all_day ? "All day" : timeRange(event.start, event.end)}
          </p>
        </div>
        <ul className="space-y-1.5 text-[13px]">
          {event.my_response && (
            <li className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" /> {RESPONSE_LABELS[event.my_response]}
            </li>
          )}
          {(event.attendees?.length ?? 0) > 0 && (
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-3 break-all">{event.attendees?.join(", ")}</span>
            </li>
          )}
          {event.organizer && (
            <li className="truncate text-xs text-muted-foreground">Organizer: {event.organizer}</li>
          )}
        </ul>
        {event.auto_added && (
          <p className="rounded-lg bg-success/10 px-2.5 py-1.5 text-xs">
            Added or accepted automatically by the assistant.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {event.meet_link && (
            <Button size="sm" asChild>
              <a href={event.meet_link} target="_blank" rel="noreferrer">
                <Video /> Join Meet
              </a>
            </Button>
          )}
          {event.html_link && (
            <Button size="sm" variant="outline" asChild>
              <a href={event.html_link} target="_blank" rel="noreferrer">
                <ExternalLink /> Google Calendar
              </a>
            </Button>
          )}
          {canUndo && (
            <Button
              size="sm"
              variant="outline"
              disabled={undo.isPending}
              onClick={() => undo.mutate(event.action_id as string)}
            >
              <RotateCcw /> Undo
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** A pending suggestion (dashed "ghost"): open it in Approvals. */
export function ProposalBox({
  proposal,
  className,
  style,
}: {
  proposal: Proposal;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href="/approvals"
      style={style}
      title={`Waiting for approval: ${proposal.reason}`}
      className={cn(
        "block overflow-hidden rounded-md border border-dashed border-primary/60 bg-primary/5 px-1.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/10",
        className,
      )}
    >
      <span className="block truncate font-medium">{proposal.title}</span>
      <span className="block truncate opacity-80">Suggested · needs approval</span>
    </Link>
  );
}
