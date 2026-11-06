"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Loader2, PenLine, Sparkles, Star, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ErrorState, Shimmer } from "@/components/common/states";
import { AutonomySection } from "@/components/preferences/autonomy-section";
import { MeetingSection } from "@/components/preferences/meeting-section";
import { NotesSection } from "@/components/preferences/notes-section";
import { SettingsCard } from "@/components/preferences/setting-row";
import { VipSection } from "@/components/preferences/vip-section";
import { VoiceSection } from "@/components/preferences/voice-section";
import { Button } from "@/components/ui/button";
import { usePreferences, useSavePreferences, useVipSuggestions } from "@/hooks/use-preferences";
import type { Schemas } from "@/lib/api/client";
import { preferencesSchema, toApi, toForm, type PreferencesForm } from "@/lib/preferences-form";

const SECTIONS = [
  { id: "voice", label: "Tone & signature", icon: PenLine },
  { id: "meetings", label: "Meeting rules", icon: CalendarClock },
  { id: "auto", label: "Auto-scheduling", icon: Zap },
  { id: "vips", label: "VIPs", icon: Star },
  { id: "learned", label: "What I've learned", icon: Sparkles },
];

function PreferencesEditor({ initial }: { initial: Schemas["PreferencesBody"] }) {
  const save = useSavePreferences();
  const suggestions = useVipSuggestions(true);
  const form = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: toForm(initial),
    mode: "onChange",
  });
  const { isDirty, isValid } = form.formState;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(toApi(values), {
      onSuccess: (saved) => {
        form.reset(toForm(saved));
        toast.success("Preferences saved. The assistant uses them from the next email.");
      },
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-5">
        <SettingsCard
          id="voice"
          icon={PenLine}
          title="Tone & signature"
          description="How your drafted replies sound."
        >
          <VoiceSection />
        </SettingsCard>
        <SettingsCard
          id="meetings"
          icon={CalendarClock}
          title="Meeting rules"
          description="Hard rules are checked in code and never broken by automatic actions."
        >
          <MeetingSection />
        </SettingsCard>
        <SettingsCard
          id="auto"
          icon={Zap}
          title="Auto-scheduling"
          description="When the assistant may act without asking."
        >
          <AutonomySection />
        </SettingsCard>
        <SettingsCard id="vips" icon={Star} title="VIPs">
          <VipSection suggestions={suggestions.data} />
        </SettingsCard>

        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="sticky bottom-4 z-20 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border bg-popover/95 px-4 py-3 shadow-xl backdrop-blur"
            >
              <span className="flex-1 text-[13px]">
                {isValid ? "You have unsaved changes." : "Fix the highlighted fields to save."}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => form.reset()}>
                Discard
              </Button>
              <Button type="submit" size="sm" disabled={!isValid || save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />} Save changes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </FormProvider>
  );
}

export function PreferencesPage() {
  const preferences = usePreferences();
  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto flex max-w-5xl gap-8 px-4 py-6 sm:px-6 lg:py-8">
        <nav aria-label="Sections" className="sticky top-6 hidden h-fit w-48 shrink-0 space-y-0.5 lg:block">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" /> {label}
            </a>
          ))}
        </nav>
        <div className="min-w-0 flex-1 space-y-5">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
            <p className="text-muted-foreground">
              Everything the assistant knows about how you write and meet. You can change any of it.
            </p>
          </header>
          {preferences.isPending ? (
            <div className="space-y-4">
              <Shimmer className="h-64 w-full rounded-2xl" />
              <Shimmer className="h-96 w-full rounded-2xl" />
            </div>
          ) : preferences.isError ? (
            <ErrorState onRetry={() => void preferences.refetch()} />
          ) : (
            <PreferencesEditor initial={preferences.data} />
          )}
          <SettingsCard
            id="learned"
            icon={Sparkles}
            title="What I've learned"
            description="Rules and standing answers the assistant follows. Suggestions come from your edits."
          >
            <NotesSection />
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
