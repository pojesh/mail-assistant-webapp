import { MailOpen } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/common/states";
import { Kbd } from "@/components/ui/kbd";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <EmptyState
      className="h-full"
      icon={MailOpen}
      title="Select an email"
      text="Pick a message to read it with its AI summary, action items and suggested next steps."
      action={
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Use <Kbd>J</Kbd> <Kbd>K</Kbd> to move, <Kbd>D</Kbd> to draft, <Kbd>T</Kbd> to find a time
        </p>
      }
    />
  );
}
