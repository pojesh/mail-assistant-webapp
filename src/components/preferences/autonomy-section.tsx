"use client";

import { Hand, Info, ShieldCheck, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { ChipsInput, ChoiceCards, NumberStepper } from "@/components/forms/inputs";
import { SettingRow } from "@/components/preferences/setting-row";
import { Switch } from "@/components/ui/switch";
import { domainSchema, type PreferencesForm } from "@/lib/preferences-form";

const LEVELS = [
  {
    value: "off" as const,
    title: "Off",
    icon: Hand,
    text: "Every invite and meeting waits for your approval in the Approvals page.",
  },
  {
    value: "trusted" as const,
    title: "Trusted senders",
    icon: ShieldCheck,
    badge: "Recommended",
    text: "Accept invites and book meetings automatically for VIPs, trusted domains and people you have emailed before.",
  },
  {
    value: "all" as const,
    title: "Everyone",
    icon: Zap,
    text: "Do it automatically for any sender, as long as the email is not suspicious and the time fits your rules.",
  },
];

/** When the assistant may accept invites or create meetings without asking. */
export function AutonomySection() {
  const { control } = useFormContext<PreferencesForm>();
  const level = useWatch<PreferencesForm, "meeting.auto_schedule">({ name: "meeting.auto_schedule" });
  return (
    <>
      <div className="space-y-3 py-4">
        <Controller
          control={control}
          name="meeting.auto_schedule"
          render={({ field }) => (
            <ChoiceCards
              name="Auto-scheduling"
              value={field.value}
              onChange={field.onChange}
              options={LEVELS}
            />
          )}
        />
        <p className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          Automatic actions only accept or create meetings, never decline. Each one must fit all your meeting
          rules, sends you a notification with Undo, and accepting an invite tells the organizer.
        </p>
      </div>
      <AnimatePresence initial={false}>
        {level !== "off" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="divide-y overflow-hidden"
          >
            {level === "trusted" && (
              <SettingRow
                label="Trusted domains"
                description="Your company domain, or close partners. Senders from these domains count as trusted."
              >
                <Controller
                  control={control}
                  name="meeting.trusted_domains"
                  render={({ field }) => (
                    <ChipsInput
                      value={field.value}
                      onChange={field.onChange}
                      schema={domainSchema}
                      placeholder="e.g. acme.com"
                      ariaLabel="Add trusted domain"
                    />
                  )}
                />
              </SettingRow>
            )}
            <SettingRow
              label="Daily limit"
              description="Most automatic actions per day; the rest go to Approvals."
            >
              <Controller
                control={control}
                name="meeting.auto_actions_per_day"
                render={({ field }) => (
                  <NumberStepper
                    ariaLabel="automatic actions per day"
                    min={0}
                    max={20}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </SettingRow>
            <SettingRow label="Undo window" description="How long the Undo button stays available.">
              <Controller
                control={control}
                name="meeting.undo_window_hours"
                render={({ field }) => (
                  <NumberStepper
                    ariaLabel="undo window"
                    unit="hours"
                    min={1}
                    max={72}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </SettingRow>
            <SettingRow
              label="VIPs may use focus time"
              description="Allow VIP meetings inside your focus blocks."
            >
              <Controller
                control={control}
                name="meeting.vip_can_override_focus"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="VIPs may use focus time"
                  />
                )}
              />
            </SettingRow>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
