"use client";

import {
  CalendarClock,
  CalendarPlus,
  ExternalLink,
  Loader2,
  Mail,
  PenLine,
  TriangleAlert,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import {
  DraftEditor,
  EventDetails,
  InviteChoice,
  OfferedTimes,
  SlotPicker,
  type InviteResponse,
} from "@/components/approvals/approval-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDecide } from "@/hooks/use-approvals";
import type { Schemas } from "@/lib/api/client";
import { senderName, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Approval = Schemas["ApprovalOut"];

const KINDS = {
  draft: { label: "Reply", icon: PenLine, approve: "Save to Gmail drafts" },
  event: { label: "New meeting", icon: CalendarPlus, approve: "Book meeting" },
  invite_response: { label: "Invite", icon: CalendarClock, approve: "Send response" },
} as const;

const RESPONSE_FOR_ACTION: Record<string, InviteResponse> = {
  accept_invite: "accepted",
  tentative_invite: "tentative",
  decline_invite: "declined",
};

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-[13px]">
      <p className="mb-1 flex items-center gap-1.5 font-medium">
        <TriangleAlert className="size-4 text-warning" /> Please check before approving
      </p>
      <ul className="list-disc space-y-0.5 pl-6 text-muted-foreground">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}

function CardHeader({ approval }: { approval: Approval }) {
  const { email } = approval.payload;
  const kind = KINDS[approval.kind];
  const Icon = kind.icon;
  return (
    <header className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{kind.label}</Badge>
          <span className="truncate font-medium">{senderName(email.from_name, email.from_email)}</span>
          <span className="ml-auto text-xs text-muted-foreground">{timeAgo(approval.created_at)}</span>
        </div>
        <p className="mt-0.5 truncate text-[13px]">{email.subject || "(no subject)"}</p>
        {approval.payload.summary && (
          <p className="mt-0.5 text-xs text-muted-foreground">{approval.payload.summary}</p>
        )}
      </div>
    </header>
  );
}

/** One item waiting for a decision. Everything is editable until you approve. */
export function PendingApprovalCard({ approval }: { approval: Approval }) {
  const decide = useDecide();
  const { payload } = approval;
  const variants = payload.variants ?? [];
  const slots = payload.slots ?? [];
  const scheduling = payload.scheduling ?? null;

  const [variant, setVariant] = useState(0);
  const [bodies, setBodies] = useState(() => variants.map((item) => item.body));
  const [slot, setSlot] = useState(0);
  const [title, setTitle] = useState(scheduling?.title ?? payload.email.subject);
  const [attendees, setAttendees] = useState<string[]>(scheduling?.attendees ?? [payload.email.from_email]);
  const [response, setResponse] = useState<InviteResponse>(
    RESPONSE_FOR_ACTION[scheduling?.action ?? ""] ?? "accepted",
  );

  function approve() {
    const decision: Schemas["ApprovalDecision"] = { action: "approve" };
    if (variants.length > 0) {
      decision.variant_index = variant;
      if (bodies[variant].trim() !== variants[variant].body.trim()) decision.edited_body = bodies[variant];
    }
    if (approval.kind === "event") {
      decision.slot_index = slot;
      if (title.trim() && title.trim() !== (scheduling?.title ?? "")) decision.title = title.trim();
      if (attendees.length > 0) decision.attendees = attendees;
    }
    if (approval.kind === "invite_response") decision.response = response;
    decide.mutate({ approval, decision });
  }

  const busy = decide.isPending;
  const draftEmpty = variants.length > 0 && !bodies[variant]?.trim();
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      className={cn(
        "space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5",
        busy && "pointer-events-none opacity-70",
      )}
      aria-busy={busy}
    >
      <CardHeader approval={approval} />
      <Warnings warnings={approval.warnings} />
      {scheduling && payload.reason && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-[13px]">
          <span className="font-medium">Why: </span>
          <span className="text-muted-foreground">{payload.reason}</span>
          {payload.autonomy_reason && (
            <span className="block text-xs text-muted-foreground">
              Not done automatically: {payload.autonomy_reason}.
            </span>
          )}
        </p>
      )}
      {approval.kind === "invite_response" && scheduling && (
        <>
          {scheduling.slot && <OfferedTimes slots={[scheduling.slot]} />}
          <InviteChoice recommended={scheduling.action} selected={response} onSelect={setResponse} />
          {response !== "declined" && (
            <p className="text-[11px] text-muted-foreground">
              Your response is sent to the organizer by Google Calendar.
            </p>
          )}
        </>
      )}
      {approval.kind === "event" && (
        <>
          <SlotPicker slots={slots} selected={slot} onSelect={setSlot} />
          <EventDetails title={title} onTitle={setTitle} attendees={attendees} onAttendees={setAttendees} />
          <p className="text-[11px] text-muted-foreground">
            Attendees get a Google Calendar invite{scheduling?.add_video_link ? " with a Meet link" : ""}.
          </p>
        </>
      )}
      {approval.kind === "draft" && <OfferedTimes slots={slots} />}
      {variants.length > 0 && (
        <DraftEditor
          variants={variants}
          selected={variant}
          onSelect={setVariant}
          bodies={bodies}
          onEdit={(index, body) =>
            setBodies((current) => current.map((value, i) => (i === index ? body : value)))
          }
        />
      )}
      <footer className="flex flex-wrap items-center gap-2 border-t pt-4">
        {approval.email_id && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/inbox/${approval.email_id}`}>
              <Mail /> Open email
            </Link>
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => decide.mutate({ approval, decision: { action: "reject" } })}
            disabled={busy}
          >
            <X /> Dismiss
          </Button>
          <Button
            onClick={approve}
            disabled={busy || draftEmpty || (approval.kind === "event" && attendees.length === 0)}
          >
            {busy && <Loader2 className="animate-spin" />}
            {KINDS[approval.kind].approve}
          </Button>
        </div>
      </footer>
    </motion.article>
  );
}

/** A decided item in the Done / Dismissed tabs. */
export function HistoryApprovalCard({ approval }: { approval: Approval }) {
  const draftSaved = approval.result && "draft_id" in approval.result;
  return (
    <article className="space-y-3 rounded-2xl border bg-card/60 p-4">
      <CardHeader approval={approval} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={approval.status === "approved" ? "default" : "secondary"}>{approval.status}</Badge>
        {approval.decided_at && <span>decided {timeAgo(approval.decided_at)}</span>}
        {draftSaved && (
          <a
            href="https://mail.google.com/mail/u/0/#drafts"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Open Gmail drafts <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </article>
  );
}
