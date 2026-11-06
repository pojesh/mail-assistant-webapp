"use client";

import { CalendarCheck2, CalendarX2, Check, CircleHelp, Clock, RotateCcw } from "lucide-react";
import { motion } from "motion/react";

import { ChipsInput } from "@/components/forms/inputs";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Schemas } from "@/lib/api/client";
import { timeRange } from "@/lib/format";
import { emailSchema } from "@/lib/preferences-form";
import { cn } from "@/lib/utils";

type Variant = Schemas["DraftVariant"];
type Slot = Schemas["Slot"];

/** Variant tabs + an editor. Edits are kept per variant until you save. */
export function DraftEditor({
  variants,
  selected,
  onSelect,
  bodies,
  onEdit,
}: {
  variants: Variant[];
  selected: number;
  onSelect: (index: number) => void;
  bodies: string[];
  onEdit: (index: number, body: string) => void;
}) {
  const edited = bodies[selected] !== variants[selected]?.body;
  return (
    <Tabs value={String(selected)} onValueChange={(value) => onSelect(Number(value))} className="gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          {variants.map((variant, index) => (
            <TabsTrigger key={variant.label + index} value={String(index)} className="text-xs">
              {variant.label}
              {bodies[index] !== variant.body && (
                <span className="ml-1 size-1.5 rounded-full bg-primary" aria-label="edited" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {edited && (
          <button
            type="button"
            onClick={() => onEdit(selected, variants[selected].body)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Undo my edits
          </button>
        )}
      </div>
      <TabsContent value={String(selected)}>
        <motion.div
          key={selected}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Textarea
            value={bodies[selected] ?? ""}
            onChange={(event) => onEdit(selected, event.target.value)}
            rows={Math.min(14, Math.max(6, (bodies[selected] ?? "").split("\n").length + 1))}
            aria-label="Reply text"
            className="font-[inherit] leading-relaxed"
          />
        </motion.div>
      </TabsContent>
      <p className="text-[11px] text-muted-foreground">
        {edited ? "Edited. Your changes help the assistant learn your style." : "You can edit before saving."}{" "}
        Saved to Gmail Drafts, never sent.
      </p>
    </Tabs>
  );
}

/** Pick one of the suggested times for a new event; each shows why it was chosen. */
export function SlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: Slot[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Meeting time" className="grid gap-2 sm:grid-cols-2">
      {slots.map((slot, index) => {
        const on = index === selected;
        return (
          <button
            key={slot.start}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(index)}
            className={cn(
              "relative flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all duration-150",
              on
                ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                : "hover:border-primary/30 hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
              )}
            >
              {on && <Check className="size-3" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">{timeRange(slot.start, slot.end)}</span>
              <span className="block text-xs text-muted-foreground">{slot.reason}</span>
            </span>
            {index === 0 && (
              <span className="absolute right-2 top-2 text-[10px] font-semibold uppercase text-primary">
                Best
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Editable meeting title and attendees (new events only). */
export function EventDetails({
  title,
  onTitle,
  attendees,
  onAttendees,
}: {
  title: string;
  onTitle: (value: string) => void;
  attendees: string[];
  onAttendees: (value: string[]) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Title</span>
        <Input value={title} onChange={(event) => onTitle(event.target.value)} maxLength={200} />
      </label>
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Attendees</span>
        <ChipsInput
          value={attendees}
          onChange={onAttendees}
          schema={emailSchema}
          placeholder="name@company.com"
          ariaLabel="Add attendee"
        />
      </div>
    </div>
  );
}

export type InviteResponse = "accepted" | "tentative" | "declined";

const RESPONSES: { value: InviteResponse; label: string; icon: typeof Check; action: string }[] = [
  { value: "accepted", label: "Accept", icon: CalendarCheck2, action: "accept_invite" },
  { value: "tentative", label: "Tentative", icon: CircleHelp, action: "tentative_invite" },
  { value: "declined", label: "Decline", icon: CalendarX2, action: "decline_invite" },
];

/** Accept / Tentative / Decline, with the assistant's recommendation highlighted. */
export function InviteChoice({
  recommended,
  selected,
  onSelect,
}: {
  recommended: string;
  selected: InviteResponse;
  onSelect: (value: InviteResponse) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Your response" className="grid grid-cols-3 gap-2">
      {RESPONSES.map(({ value, label, icon: Icon, action }) => {
        const on = selected === value;
        const isRecommended = recommended === action;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(value)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[13px] font-medium transition-all duration-150",
              on
                ? value === "declined"
                  ? "border-destructive/60 bg-destructive/5 text-destructive ring-1 ring-destructive/30"
                  : "border-primary bg-primary/5 text-primary ring-1 ring-primary/40"
                : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
            {isRecommended && (
              <span className="absolute -top-2 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                Suggested
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The times a reply offers to the sender (read-only; they are written into the draft). */
export function OfferedTimes({ slots }: { slots: Slot[] }) {
  if (slots.length === 0) return null;
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Times offered in this reply
      </p>
      <ul className="space-y-1.5">
        {slots.map((slot) => (
          <li key={slot.start} className="flex items-start gap-2 text-[13px]">
            <Clock className="mt-0.5 size-3.5 shrink-0 text-cat-meeting" />
            <span>
              <span className="font-medium">{timeRange(slot.start, slot.end)}</span>
              <span className="text-muted-foreground"> · {slot.reason}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
