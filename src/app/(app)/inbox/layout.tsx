import { InboxLayout } from "@/components/inbox/inbox-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <InboxLayout>{children}</InboxLayout>;
}
