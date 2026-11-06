"use client";

import { CheckCheck, Inbox, ShieldCheck } from "lucide-react";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { HistoryApprovalCard, PendingApprovalCard } from "@/components/approvals/approval-card";
import { EmptyState, ErrorState, Shimmer } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApprovals, type ApprovalStatus } from "@/hooks/use-approvals";

const TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Done" },
  { value: "rejected", label: "Dismissed" },
];

function ApprovalList({ status }: { status: ApprovalStatus }) {
  const approvals = useApprovals(status);
  if (approvals.isPending)
    return (
      <div className="space-y-4">
        <Shimmer className="h-64 w-full rounded-2xl" />
        <Shimmer className="h-40 w-full rounded-2xl" />
      </div>
    );
  if (approvals.isError) return <ErrorState onRetry={() => void approvals.refetch()} />;
  const items = approvals.data.items;
  if (items.length === 0)
    return status === "pending" ? (
      <EmptyState
        icon={CheckCheck}
        title="Nothing is waiting for you"
        text="Drafts, meetings and invite responses appear here before anything is written to Gmail or Calendar."
        action={
          <Button variant="outline" asChild>
            <Link href="/inbox">
              <Inbox /> Back to inbox
            </Link>
          </Button>
        }
      />
    ) : (
      <EmptyState icon={CheckCheck} title="Nothing here yet" />
    );
  return (
    <div className="space-y-4">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((approval) =>
          status === "pending" ? (
            <PendingApprovalCard key={approval.id} approval={approval} />
          ) : (
            <HistoryApprovalCard key={approval.id} approval={approval} />
          ),
        )}
      </AnimatePresence>
    </div>
  );
}

export function ApprovalsPage() {
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as ApprovalStatus)}
        className="mx-auto max-w-3xl gap-5 px-4 py-6 sm:px-6 lg:py-8"
      >
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="size-4 text-success" /> Nothing is written to Gmail or Calendar until
              you approve.
            </p>
          </div>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </header>
        <TabsContent value={status}>
          <ApprovalList key={status} status={status} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
