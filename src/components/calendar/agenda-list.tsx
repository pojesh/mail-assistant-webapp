"use client";

import { CalendarDays } from "lucide-react";
import { motion } from "motion/react";

import {
  AiBadge,
  EventPopover,
  ProposalBox,
  eventTone,
  type AgendaEvent,
  type Proposal,
} from "@/components/calendar/calendar-items";
import { EmptyState } from "@/components/common/states";
import { sameDay } from "@/lib/calendar-layout";
import { cn } from "@/lib/utils";

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/** Phone view: one list per day, with suggested times waiting for approval. */
export function AgendaList({
  days,
  events,
  proposals,
}: {
  days: Date[];
  events: AgendaEvent[];
  proposals: Proposal[];
}) {
  const today = new Date();
  const anything = events.length + proposals.length > 0;
  if (!anything)
    return (
      <EmptyState
        icon={CalendarDays}
        title="A clear week"
        text="No meetings or suggestions in these seven days."
      />
    );
  return (
    <div className="space-y-5 p-4">
      {days.map((day) => {
        const dayEvents = events.filter((event) => sameDay(new Date(event.start), day));
        const dayProposals = proposals.filter((proposal) => sameDay(new Date(proposal.start), day));
        if (dayEvents.length + dayProposals.length === 0) return null;
        return (
          <section key={day.toISOString()}>
            <h2
              className={cn(
                "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                sameDay(day, today) && "text-primary",
              )}
            >
              {sameDay(day, today) ? "Today · " : ""}
              {day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
            </h2>
            <ul className="space-y-2">
              {dayEvents.map((event, index) => (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <EventPopover event={event}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left",
                        eventTone(event),
                      )}
                    >
                      <span className="w-16 shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                        {event.all_day ? "All day" : clock(event.start)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {event.summary || "(no title)"}
                      </span>
                      {event.auto_added && <AiBadge />}
                    </button>
                  </EventPopover>
                </motion.li>
              ))}
              {dayProposals.map((proposal) => (
                <li key={`${proposal.approval_id}-${proposal.start}`}>
                  <ProposalBox proposal={proposal} className="rounded-xl px-3 py-2.5 text-[13px]" />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
