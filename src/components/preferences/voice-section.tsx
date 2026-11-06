"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import { SettingRow } from "@/components/preferences/setting-row";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PreferencesForm } from "@/lib/preferences-form";
import { cn } from "@/lib/utils";

const TONE_IDEAS = [
  "friendly and professional",
  "warm and casual",
  "concise and formal",
  "upbeat and direct",
];
const LANGUAGES = ["English", "Hindi", "Tamil", "Spanish", "French", "German", "Portuguese", "Japanese"];

/** How the last lines of every draft will look. */
function SignaturePreview() {
  const [signOff, signature] = useWatch<PreferencesForm, ["sign_off", "signature"]>({
    name: ["sign_off", "signature"],
  });
  return (
    <div className="mt-3 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-[13px]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
      <p className="text-muted-foreground">Hi Priya, thanks for the update. I will review it today.</p>
      <p className="mt-3 whitespace-pre-line">
        {signOff.trim() ? `${signOff.trim().replace(/,$/, "")},` : ""}
        {signature.trim() ? `\n${signature.trim()}` : ""}
      </p>
    </div>
  );
}

/** Tone, language, sign-off and signature: how drafted replies sound. */
export function VoiceSection() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<PreferencesForm>();
  const tone = useWatch<PreferencesForm, "tone">({ name: "tone" });
  return (
    <>
      <SettingRow
        label="Tone"
        htmlFor="tone"
        description="A few words the assistant follows in every draft."
        error={errors.tone?.message}
      >
        <Input id="tone" {...register("tone")} placeholder="e.g. friendly and professional" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TONE_IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setValue("tone", idea, { shouldDirty: true, shouldValidate: true })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                tone === idea
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {idea}
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow label="Language" htmlFor="language" description="Drafts are written in this language.">
        <Input id="language" list="language-ideas" {...register("language")} className="sm:w-60" />
        <datalist id="language-ideas">
          {LANGUAGES.map((language) => (
            <option key={language} value={language} />
          ))}
        </datalist>
      </SettingRow>
      <SettingRow
        label="Sign-off and signature"
        htmlFor="sign_off"
        description="Added to the end of every draft by code, so it is always exactly right."
      >
        <div className="grid gap-2">
          <Input id="sign_off" {...register("sign_off")} placeholder="Best regards" className="sm:w-60" />
          <Controller
            control={control}
            name="signature"
            render={({ field }) => (
              <Textarea
                {...field}
                rows={3}
                placeholder={"Your name\nRole · Company"}
                aria-label="Signature"
              />
            )}
          />
        </div>
        <SignaturePreview />
      </SettingRow>
    </>
  );
}
