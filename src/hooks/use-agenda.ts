"use client";

import { useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

/** Events between two instants (ISO with offset), plus pending proposals as ghosts. */
export function useAgenda(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery({
    queryKey: queryKeys.agenda(fromIso, toIso),
    queryFn: () =>
      unwrap(api.GET("/api/calendar/agenda", { params: { query: { from: fromIso, to: toIso } } })),
    refetchInterval: 120_000,
  });
}
