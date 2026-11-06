"use client";

import { Plus, Star } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { ChipsInput } from "@/components/forms/inputs";
import { SettingRow } from "@/components/preferences/setting-row";
import type { Schemas } from "@/lib/api/client";
import { senderName } from "@/lib/format";
import type { PreferencesForm } from "@/lib/preferences-form";

/** A VIP is an email address, or a whole domain written as @client.com. */
const vipSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^@[a-z0-9.-]+\.[a-z]{2,}$/.test(value), {
    message: "Use an email address or @domain.com",
  });

/** VIP senders: higher priority, more formal replies, and trusted for auto-scheduling. */
export function VipSection({ suggestions }: { suggestions?: Schemas["VipSuggestion"][] }) {
  const { control, watch, setValue } = useFormContext<PreferencesForm>();
  const vips = watch("vip_senders");
  const fresh = (suggestions ?? []).filter((item) => !vips.includes(item.email.toLowerCase()));
  return (
    <SettingRow
      label="VIP senders"
      description="Their emails get higher priority and more careful replies, and they count as trusted."
    >
      <Controller
        control={control}
        name="vip_senders"
        render={({ field }) => (
          <ChipsInput
            value={field.value}
            onChange={field.onChange}
            schema={vipSchema}
            placeholder="boss@company.com or @client.com"
            ariaLabel="Add VIP sender"
          />
        )}
      />
      {fresh.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">People you email most</p>
          <div className="flex flex-wrap gap-1.5">
            {fresh.slice(0, 8).map((item) => (
              <button
                key={item.email}
                type="button"
                onClick={() =>
                  setValue("vip_senders", [...vips, item.email.toLowerCase()], { shouldDirty: true })
                }
                className="group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Plus className="size-3 text-muted-foreground group-hover:text-primary" />
                {senderName(item.name, item.email)}
                <span className="text-muted-foreground">· {item.messages}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {vips.length === 0 && fresh.length === 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="size-3" /> No VIPs yet.
        </p>
      )}
    </SettingRow>
  );
}
