"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

import { ApiError, api, unwrap, type Schemas } from "@/lib/api/client";
import type { Category, Sentiment } from "@/lib/categories";
import { queryKeys } from "@/lib/query-keys";

export type EmailFilters = {
  category?: Category;
  priority?: number;
  sentiment?: Sentiment;
  unread?: boolean;
  q?: string;
};

const PAGE_SIZE = 30;

/** Inbox filters live in the URL (?category=…&priority=…), so they survive reloads and links. */
export function useEmailFilters(): EmailFilters {
  const params = useSearchParams();
  return useMemo(() => {
    const priority = Number(params.get("priority"));
    return {
      category: (params.get("category") as Category | null) ?? undefined,
      priority: priority >= 1 && priority <= 5 ? priority : undefined,
      sentiment: (params.get("sentiment") as Sentiment | null) ?? undefined,
      unread: params.get("unread") === "1" ? true : undefined,
      q: params.get("q")?.trim() || undefined,
    };
  }, [params]);
}

export function useEmails(filters: EmailFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.emails(filters),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET("/api/emails", {
          params: { query: { ...filters, cursor: pageParam, limit: PAGE_SIZE } },
        }),
      ),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: queryKeys.email(id),
    queryFn: () => unwrap(api.GET("/api/emails/{email_id}", { params: { path: { email_id: id } } })),
  });
}

type FlowKind = "draft" | "schedule";

/** "Draft reply" / "Find a time": runs the same graph as new mail; results go to Approvals. */
export function useStartFlow(emailId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (kind: FlowKind): Promise<Schemas["FlowStartResponse"]> => {
      const options = { params: { path: { email_id: emailId } } };
      return kind === "draft"
        ? unwrap(api.POST("/api/emails/{email_id}/draft", options))
        : unwrap(api.POST("/api/emails/{email_id}/schedule", options));
    },
    onSuccess: (result) => {
      if (result.status === "approval_created") {
        toast.success(result.message, {
          action: { label: "Open Approvals", onClick: () => router.push("/approvals") },
        });
      } else if (result.status === "auto_scheduled") {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Something went wrong."),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.email(emailId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.allApprovals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
