"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiError, api, unwrap } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

/** Counts for the sidebar badges and the dashboard strip. */
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => unwrap(api.GET("/api/dashboard")),
    refetchInterval: 60_000,
  });
}

/** "Sync now": runs the same sync as Gmail push notifications. */
export function useSyncNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/sync")),
    onSuccess: (result) => {
      if (result.status === "already_syncing") {
        toast.info("A sync is already running. New mail will appear shortly.");
      } else if (result.processed === 0) {
        toast.success("You're up to date.");
      } else {
        const more = result.remaining > 0 ? ` (${result.remaining} more on the next sync)` : "";
        toast.success(`${result.processed} new email${result.processed === 1 ? "" : "s"} triaged${more}.`);
      }
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Sync failed."),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.allEmails });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => unwrap(api.GET("/api/notifications")),
    refetchInterval: 45_000,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/auth/logout")),
    onSettled: () => {
      queryClient.clear(); // forget every cached email of this account
      router.replace("/");
    },
  });
}
