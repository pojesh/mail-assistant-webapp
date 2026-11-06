"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Loader2,
  Mail,
  PenLine,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { LogoMark } from "@/components/brand/logo";
import { AutonomySection } from "@/components/preferences/autonomy-section";
import { MeetingSection } from "@/components/preferences/meeting-section";
import { VipSection } from "@/components/preferences/vip-section";
import { VoiceSection } from "@/components/preferences/voice-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useCompleteOnboarding,
  useLearnStyle,
  useSavePreferences,
  useVipSuggestions,
} from "@/hooks/use-preferences";
import { ApiError, type Schemas } from "@/lib/api/client";
import { initials, senderName } from "@/lib/format";
import {
  browserTimezone,
  preferencesSchema,
  toApi,
  toForm,
  type PreferencesForm,
} from "@/lib/preferences-form";
import { cn } from "@/lib/utils";

type Step = { title: string; subtitle: string; icon: typeof Mail; fields: FieldPath<PreferencesForm>[] };

const STEPS: Step[] = [
  { title: "You're connected", subtitle: "Gmail and Google Calendar are linked.", icon: Mail, fields: [] },
  {
    title: "Your meeting rules",
    subtitle: "Hard rules are never broken, even by automatic actions.",
    icon: CalendarClock,
    fields: ["timezone", "meeting"],
  },
  {
    title: "Auto-scheduling",
    subtitle: "Decide when the assistant may act without asking.",
    icon: Zap,
    fields: ["meeting.auto_schedule", "meeting.trusted_domains"],
  },
  {
    title: "How you write",
    subtitle: "Drafts follow your tone and end with your signature.",
    icon: PenLine,
    fields: ["tone", "language", "sign_off", "signature"],
  },
  {
    title: "Your VIPs",
    subtitle: "Important people get priority and careful replies.",
    icon: Star,
    fields: ["vip_senders"],
  },
  {
    title: "Learning your style",
    subtitle: "Reading your recent sent emails to match how you write.",
    icon: Sparkles,
    fields: [],
  },
];

const LEARNING_MESSAGES = [
  "Reading your recent sent emails…",
  "Noticing how you greet people…",
  "Picking up your usual sign-offs…",
  "Learning how long your replies are…",
  "Almost there…",
];

function AccountStep({ me }: { me: Schemas["MeResponse"] }) {
  const name = senderName(me.name, me.email);
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="relative">
        <Avatar className="size-20 ring-4 ring-primary/15">
          {me.picture_url && <AvatarImage src={me.picture_url} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback className="text-lg font-semibold">{initials(name)}</AvatarFallback>
        </Avatar>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
          className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-success text-white ring-4 ring-background"
        >
          <Check className="size-4" />
        </motion.span>
      </div>
      <div>
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-muted-foreground">{me.email}</p>
      </div>
      <ul className="mt-2 grid w-full max-w-md gap-2 text-left text-[13px]">
        {[
          "New mail is sorted and summarised automatically.",
          "Replies are saved as Gmail drafts, never sent.",
          "Anything that changes your calendar waits for your OK unless you allow it next.",
        ].map((line) => (
          <li key={line} className="flex items-start gap-2 rounded-lg border bg-card px-3 py-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" /> {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LearningStep({
  state,
  embedded,
}: {
  state: "running" | "done" | "error" | "saving";
  embedded: number | null;
}) {
  const [message, setMessage] = useState(0);
  useEffect(() => {
    if (state !== "running") return;
    const id = window.setInterval(
      () => setMessage((value) => Math.min(value + 1, LEARNING_MESSAGES.length - 1)),
      6000,
    );
    return () => window.clearInterval(id);
  }, [state]);
  const done = state === "done";
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <motion.div
        animate={done ? { scale: [1, 1.12, 1] } : { rotate: 360 }}
        transition={done ? { duration: 0.5 } : { repeat: Infinity, duration: 3, ease: "linear" }}
        className={cn(
          "flex size-16 items-center justify-center rounded-2xl",
          done
            ? "bg-success text-white"
            : "bg-gradient-to-br from-primary to-[oklch(0.6_0.22_300)] text-primary-foreground",
        )}
      >
        {done ? <Check className="size-8" /> : <Sparkles className="size-7" />}
      </motion.div>
      <div className="min-h-12">
        <AnimatePresence mode="wait">
          <motion.p
            key={done ? "done" : state === "error" ? "error" : message}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="font-medium"
          >
            {done
              ? embedded
                ? `Learned your style from ${embedded} sent emails.`
                : "All set. The assistant will keep learning from your sent mail."
              : state === "error"
                ? "Could not read your sent mail right now. You can continue; it will learn over time."
                : state === "saving"
                  ? "Saving your preferences…"
                  : LEARNING_MESSAGES[message]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Only short style examples are kept, never attachments.
        </p>
      </div>
      {!done && state !== "error" && (
        <Progress value={null} className="h-1.5 w-64 overflow-hidden [&>div]:animate-pulse" />
      )}
    </div>
  );
}

/** Six-step setup. Writing-style learning starts at step 2 and runs while the user fills in the rest. */
export function OnboardingWizard({
  me,
  initial,
}: {
  me: Schemas["MeResponse"];
  initial: Schemas["PreferencesBody"];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const learn = useLearnStyle();
  const save = useSavePreferences();
  const complete = useCompleteOnboarding();
  const learnStarted = useRef(false);
  const suggestions = useVipSuggestions(step >= 4);

  const [defaults] = useState(() => {
    const values = toForm(initial);
    if (values.timezone === "UTC") values.timezone = browserTimezone(); // a better first guess
    return values;
  });
  const form = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  // Start learning early, so it is usually finished by the last step.
  useEffect(() => {
    if (step >= 1 && !learnStarted.current) {
      learnStarted.current = true;
      learn.mutate();
    }
  }, [step, learn]);

  // Refresh VIP suggestions once sent mail has been imported.
  const { refetch: refetchSuggestions } = suggestions;
  useEffect(() => {
    if (learn.isSuccess) void refetchSuggestions();
  }, [learn.isSuccess, refetchSuggestions]);

  async function go(next: number) {
    if (next > step && !(await form.trigger(STEPS[step].fields))) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function finish() {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Some settings need attention.");
      return;
    }
    try {
      await save.mutateAsync(toApi(form.getValues()));
      await complete.mutateAsync();
      router.replace("/inbox");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not finish setup. Please try again.");
    }
  }

  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;
  const learningState = learn.isError
    ? "error"
    : learn.isSuccess
      ? save.isPending || complete.isPending
        ? "saving"
        : "done"
      : "running";
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <LogoMark className="size-7" />
          <span className="text-[13px] text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
          <ol className="ml-auto hidden gap-1.5 sm:flex" aria-label="Progress">
            {STEPS.map((item, index) => (
              <li
                key={item.title}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors duration-300",
                  index <= step ? "bg-primary" : "bg-muted",
                )}
                aria-current={index === step ? "step" : undefined}
              />
            ))}
          </ol>
        </div>
        <div className="h-0.5 bg-muted sm:hidden">
          <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{current.title}</h1>
                <p className="text-muted-foreground">{current.subtitle}</p>
              </div>
            </div>
            <FormProvider {...form}>
              <div
                className={cn(
                  step > 0 && step < 5 && "divide-y rounded-2xl border bg-card px-5 shadow-sm sm:px-6",
                )}
              >
                {step === 0 && <AccountStep me={me} />}
                {step === 1 && <MeetingSection />}
                {step === 2 && <AutonomySection />}
                {step === 3 && <VoiceSection />}
                {step === 4 && <VipSection suggestions={suggestions.data} />}
                {step === 5 && <LearningStep state={learningState} embedded={learn.data?.embedded ?? null} />}
              </div>
            </FormProvider>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 border-t bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          {step > 0 && (
            <Button variant="ghost" onClick={() => void go(step - 1)}>
              <ArrowLeft /> Back
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {last ? (
              <Button
                onClick={() => void finish()}
                disabled={learn.isPending || save.isPending || complete.isPending}
                size="lg"
              >
                {save.isPending || complete.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                {learn.isPending ? "Learning…" : "Go to my inbox"}
              </Button>
            ) : (
              <Button onClick={() => void go(step + 1)} size="lg">
                {step === 0 ? "Let's set it up" : "Continue"} <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
