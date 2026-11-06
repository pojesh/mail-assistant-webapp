import type { Metadata } from "next";

import { EmailDetailView } from "@/components/inbox/email-detail";

export const metadata: Metadata = { title: "Email" };

export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmailDetailView id={id} />;
}
