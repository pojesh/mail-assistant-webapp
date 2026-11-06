"use client";

import { useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

/** The signed-in user (401 -> error with status 401, handled by the app shell). */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => unwrap(api.GET("/api/me")),
    staleTime: 60_000,
  });
}
