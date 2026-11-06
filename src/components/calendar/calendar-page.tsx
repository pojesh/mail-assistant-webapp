"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { AgendaList } from "@/components/calendar/agenda-list";
import { WeekGrid } from "@/components/calendar/week-grid";
import { ErrorState, Shimmer } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useAgenda } from "@/hooks/use-agenda";
import { addDays, startOfWeek, weekDays } from "@/lib/calendar-layout";

function weekLabel(start: Date): string {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startText = start.toLocaleDateString(undefined, {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });
  const endText = end.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return `${startText} – ${endText}`;
}

export function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const agenda = useAgenda(weekStart, addDays(weekStart, 7));
  const events = agenda.data?.events ?? [];
  const proposals = agenda.data?.proposals ?? [];
  const autoCount = events.filter((event) => event.auto_added).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-6">
        <h1 className="mr-2 text-lg font-semibold tracking-tight">{weekLabel(weekStart)}</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous week"
            onClick={() => setWeekStart((value) => addDays(value, -7))}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next week"
            onClick={() => setWeekStart((value) => addDays(value, 7))}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {autoCount > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="size-3.5 text-success" /> {autoCount} added by the assistant
            </span>
          )}
          {proposals.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-dashed border-primary" /> {proposals.length}{" "}
              suggested, waiting for approval
            </span>
          )}
        </div>
      </header>
      {agenda.isPending ? (
        <div className="space-y-2 p-6">
          <Shimmer className="h-10 w-full" />
          <Shimmer className="h-[28rem] w-full rounded-xl" />
        </div>
      ) : agenda.isError ? (
        <ErrorState onRetry={() => void agenda.refetch()} />
      ) : (
        <>
          <div className="scrollbar-thin hidden min-h-0 flex-1 overflow-auto md:block">
            <WeekGrid days={days} events={events} proposals={proposals} />
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto md:hidden">
            <AgendaList days={days} events={events} proposals={proposals} />
          </div>
        </>
      )}
    </div>
  );
}
