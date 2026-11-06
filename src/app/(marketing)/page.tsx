import { CalendarClock, Inbox, Lock, MessagesSquare, PenLine, ShieldCheck } from "lucide-react";
import { Suspense } from "react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { AuthNotice } from "@/components/landing/auth-notice";
import { GoogleButton, LOGIN_URL } from "@/components/landing/google-button";
import { ProductPreview } from "@/components/landing/product-preview";

const FEATURES = [
  {
    icon: Inbox,
    title: "Inbox triage",
    text: "Every email gets a category, priority, sentiment and a one-line summary. Newsletters stay out of your way.",
  },
  {
    icon: PenLine,
    title: "Replies in your voice",
    text: "Two or three draft variants, written from your past emails and preferences, saved to Gmail Drafts.",
  },
  {
    icon: CalendarClock,
    title: "Scheduling that knows your rules",
    text: "Working hours, focus blocks, lunch and buffers are checked in code before any time is offered.",
  },
  {
    icon: MessagesSquare,
    title: "Chat with your inbox",
    text: "Ask “what did the client say about the deadline?” and get answers with the emails they come from.",
  },
];

const PROMISES = [
  "The app never sends email. Replies are saved as Gmail drafts.",
  "Anything that writes goes to your Approvals queue first.",
  "Automatic scheduling is opt-in, limited and always undoable.",
  "Emails that try to manipulate the AI are flagged and never automated.",
];

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <a
            href={LOGIN_URL}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign in
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 text-center sm:pt-16">
        <Suspense>
          <AuthNotice />
        </Suspense>
        <p className="mx-auto mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <ShieldCheck className="size-3.5 text-success" /> Drafts only. Nothing is sent without you.
        </p>
        <h1 className="mx-auto max-w-3xl animate-fade-up text-balance text-4xl font-semibold tracking-tight [animation-delay:60ms] sm:text-6xl">
          Your inbox, triaged.{" "}
          <span className="bg-gradient-to-r from-primary to-[oklch(0.62_0.2_310)] bg-clip-text text-transparent">
            Replies, drafted.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl animate-fade-up text-pretty text-base text-muted-foreground [animation-delay:120ms] sm:text-lg">
          An AI assistant for Gmail and Google Calendar that sorts your mail, writes replies in your own tone
          and finds meeting times that respect how you like to work.
        </p>
        <div className="mt-8 flex animate-fade-up flex-col items-center gap-3 [animation-delay:180ms]">
          <GoogleButton />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> Every action waits for your approval
          </p>
        </div>

        <div className="mt-16 sm:mt-20">
          <ProductPreview />
        </div>

        <section
          aria-label="Features"
          className="mx-auto mt-24 grid max-w-5xl gap-4 text-left sm:grid-cols-2"
        >
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border bg-card/60 p-6 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <Icon className="size-5" />
              </span>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-3xl rounded-2xl border bg-card/60 p-6 text-left backdrop-blur sm:p-8">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-success" /> Built to stay out of trouble
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex gap-2">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {promise}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Mail Assistant · Your Google data is encrypted at rest and you can delete it at any time.
      </footer>
    </div>
  );
}
