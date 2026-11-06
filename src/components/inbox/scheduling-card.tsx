"use client";

import { CalendarCheck2, CalendarClock, CalendarX2, Clock, RotateCcw } from "lucide-react";
import Link from "next/link";

import { useUndoAction } from "@/components/shell/notification-bell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Schemas } from "@/lib/api/client";
import { timeRange } from "@/lib/format";

type Info = Schemas["SchedulingInfo"];

const ACTION_LABELS: Record<Info["decision"]["action"], string> = {
  accept_invite: "Accept the invite",
  tentative_invite: "Tentatively accept",
  decline_invite: "Decline the invite",
  propose_new_time: "Propose a new time",
  create_event: "Create the meeting",
  propose_times: "Offer times",
  ignore: "No meeting needed",
};

function StateBadge({ info }: { info: Info }) {
  if (info.state === "auto")
    return <Badge className="bg-success/15 text-success hover:bg-success/15">Done automatically</Badge>;
  if (info.state === "approved")
    return <Badge className="bg-success/15 text-success hover:bg-success/15">Done after approval</Badge>;
  if (info.state === "undone") return <Badge variant="secondary">Undone</Badge>;
  return <Badge className="bg-warning/15 text-warning hover:bg-warning/15">Waiting for approval</Badge>;
}

/** What the scheduling assistant decided for this email, and where it stands. */
export function SchedulingCard({ info }: { info: Info }) {
  const undo = useUndoAction();
  const { decision } = info;
  const Icon = decision.action.startsWith("decline")
    ? CalendarX2
    : info.state === "pending"
      ? CalendarClock
      : CalendarCheck2;
  const canUndo =
    info.state === "auto" && info.action_id && info.undo_until && new Date(info.undo_until) > new Date();
  const slots = decision.slot ? [decision.slot] : (decision.proposed_slots ?? []);

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm" aria-label="Scheduling">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cat-meeting/10 text-cat-meeting">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{ACTION_LABELS[decision.action]}</p>
            <StateBadge info={info} />
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">{decision.reason}</p>
        </div>
      </div>
      {slots.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {slots.map((slot) => (
            <li
              key={slot.start}
              className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[13px]"
            >
              <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{timeRange(slot.start, slot.end)}</p>
                <p className="text-xs text-muted-foreground">{slot.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {canUndo && (
          <Button
            size="sm"
            variant="outline"
            disabled={undo.isPending}
            onClick={() => undo.mutate(info.action_id as string)}
          >
            <RotateCcw /> Undo
          </Button>
        )}
        {info.state === "pending" && (
          <Button size="sm" asChild>
            <Link href="/approvals">Review in Approvals</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
