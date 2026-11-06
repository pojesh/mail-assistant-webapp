"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import {
  AiBadge,
  EventPopover,
  ProposalBox,
  eventTone,
  type AgendaEvent,
  type Proposal,
} from "@/components/calendar/calendar-items";
import { hourRange, layoutDay, minutesOfDay, sameDay, type TimedItem } from "@/lib/calendar-layout";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 52; // px per hour

type GridItem = TimedItem &
  ({ type: "event"; event: AgendaEvent } | { type: "proposal"; proposal: Proposal });

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Seven columns with hours down the side; overlapping events share the width. */
export function WeekGrid({
  days,
  events,
  proposals,
}: {
  days: Date[];
  events: AgendaEvent[];
  proposals: Proposal[];
}) {
  const now = useNow();
  const timed: GridItem[] = useMemo(
    () => [
      ...events
        .filter((event) => !event.all_day)
        .map((event) => ({
          key: event.id,
          start: new Date(event.start),
          end: new Date(event.end),
          type: "event" as const,
          event,
        })),
      ...proposals.map((proposal) => ({
        key: `${proposal.approval_id}-${proposal.start}`,
        start: new Date(proposal.start),
        end: new Date(proposal.end),
        type: "proposal" as const,
        proposal,
      })),
    ],
    [events, proposals],
  );
  const allDay = events.filter((event) => event.all_day);
  const { first, last } = hourRange(timed);
  const hours = Array.from({ length: last - first }, (_, index) => first + index);
  const top = (date: Date) => ((minutesOfDay(date) - first * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className="min-w-[720px]">
      {/* Day headers + all-day events */}
      <div className="sticky top-0 z-10 grid grid-cols-[3.5rem_repeat(7,1fr)] border-b bg-background/90 backdrop-blur">
        <div />
        {days.map((day) => {
          const today = sameDay(day, now);
          const dayAllDay = allDay.filter((event) => sameDay(new Date(event.start), day));
          return (
            <div key={day.toISOString()} className="border-l px-1.5 py-2 text-center">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p
                className={cn(
                  "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                  today && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </p>
              {dayAllDay.map((event) => (
                <EventPopover key={event.id} event={event}>
                  <button
                    type="button"
                    className={cn(
                      "mt-1 block w-full truncate rounded border px-1 text-left text-[11px]",
                      eventTone(event),
                    )}
                  >
                    {event.summary}
                  </button>
                </EventPopover>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="relative grid grid-cols-[3.5rem_repeat(7,1fr)] pt-3">
        <div>
          {hours.map((hour) => (
            <div key={hour} style={{ height: HOUR_HEIGHT }} className="relative">
              <span className="absolute -top-2 right-2 text-[11px] tabular-nums text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => {
          const placed = layoutDay(timed.filter((item) => sameDay(item.start, day)));
          const today = sameDay(day, now);
          return (
            <div key={day.toISOString()} className={cn("relative border-l", today && "bg-primary/[0.03]")}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-b border-dashed border-border/60"
                />
              ))}
              {placed.map((item, index) => {
                const height = Math.max(
                  20,
                  ((item.end.getTime() - item.start.getTime()) / 3_600_000) * HOUR_HEIGHT - 2,
                );
                const style = {
                  top: top(item.start) + 1,
                  height,
                  left: `calc(${(item.lane / item.lanes) * 100}% + 2px)`,
                  width: `calc(${100 / item.lanes}% - 4px)`,
                };
                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: dayIndex * 0.02 + index * 0.02 }}
                    className="absolute"
                    style={style}
                  >
                    {item.type === "proposal" ? (
                      <ProposalBox proposal={item.proposal} className="h-full" />
                    ) : (
                      <EventPopover event={item.event}>
                        <button
                          type="button"
                          className={cn(
                            "block h-full w-full overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition-shadow hover:shadow-md",
                            eventTone(item.event),
                          )}
                        >
                          <span className="flex items-center gap-1 font-medium">
                            <span className="truncate">{item.event.summary || "(no title)"}</span>
                            {item.event.auto_added && <AiBadge />}
                          </span>
                          {height > 34 && (
                            <span className="block truncate text-muted-foreground">
                              {item.start.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </button>
                      </EventPopover>
                    )}
                  </motion.div>
                );
              })}
              {today && minutesOfDay(now) >= first * 60 && minutesOfDay(now) <= last * 60 && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-[5] flex items-center"
                  style={{ top: top(now) }}
                  aria-hidden
                >
                  <span className="-ml-1 size-2 rounded-full bg-destructive" />
                  <span className="h-px flex-1 bg-destructive" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
