"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api, unwrap, type Schemas } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export type ApprovalStatus = Schemas["ApprovalOut"]["status"];
type Approval = Schemas["ApprovalOut"];
type ApprovalList = Schemas["ApprovalList"];

export function useApprovals(status: ApprovalStatus) {
  return useQuery({
    queryKey: queryKeys.approvals(status),
    queryFn: () => unwrap(api.GET("/api/approvals", { params: { query: { status } } })),
    refetchInterval: status === "pending" ? 30_000 : false,
  });
}

/** Approve or dismiss. The card leaves the Pending list at once (optimistic) and comes back on error. */
export function useDecide() {
  const queryClient = useQueryClient();
  const pendingKey = queryKeys.approvals("pending");
  return useMutation({
    mutationFn: ({ approval, decision }: { approval: Approval; decision: Schemas["ApprovalDecision"] }) =>
      unwrap(
        api.POST("/api/approvals/{approval_id}/decide", {
          params: { path: { approval_id: approval.id } },
          body: decision,
        }),
      ),
    onMutate: async ({ approval }) => {
      await queryClient.cancelQueries({ queryKey: pendingKey });
      const previous = queryClient.getQueryData<ApprovalList>(pendingKey);
      queryClient.setQueryData<ApprovalList>(pendingKey, (list) =>
        list ? { items: list.items.filter((item) => item.id !== approval.id) } : list,
      );
      return { previous };
    },
    onSuccess: (result) => {
      if (result.outcome === "done") toast.success(result.message);
      else if (result.outcome === "rejected") toast(result.message);
      else if (result.outcome === "stale") toast.info(result.message);
      else toast.error(result.message);
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(pendingKey, context?.previous);
      toast.error(error instanceof ApiError ? error.message : "Could not complete that. Please try again.");
    },
    onSettled: (_result, _error, { approval }) => {
      for (const key of [queryKeys.allApprovals, queryKeys.dashboard, queryKeys.notifications, ["agenda"]]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      if (approval.email_id)
        void queryClient.invalidateQueries({ queryKey: queryKeys.email(approval.email_id) });
    },
  });
}
