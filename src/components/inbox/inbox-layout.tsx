"use client";

import { useParams } from "next/navigation";

import { DashboardStrip } from "@/components/inbox/dashboard-strip";
import { EmailList } from "@/components/inbox/email-list";
import { cn } from "@/lib/utils";

/** Desktop: list + open email side by side. Phone: the list, or the open email. */
export function InboxLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id?: string }>();
  const hasOpenEmail = Boolean(id);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn(hasOpenEmail && "hidden lg:block")}>
        <DashboardStrip />
      </div>
      <div className="flex min-h-0 flex-1">
        <section
          aria-label="Inbox"
          className={cn(
            "h-full min-h-0 w-full shrink-0 border-r lg:block lg:w-[22rem] xl:w-[24rem] 2xl:w-[26rem]",
            hasOpenEmail && "hidden",
          )}
        >
          <EmailList />
        </section>
        <section
          aria-label="Email"
          className={cn("h-full min-h-0 min-w-0 flex-1", !hasOpenEmail && "hidden lg:block")}
        >
          {children}
        </section>
      </div>
    </div>
  );
}
