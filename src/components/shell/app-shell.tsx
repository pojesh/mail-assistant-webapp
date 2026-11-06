"use client";

import { RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LogoMark } from "@/components/brand/logo";
import { LOGIN_URL } from "@/components/landing/google-button";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatProvider } from "@/components/chat/chat-provider";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { Shortcuts } from "@/components/shell/shortcuts";
import { TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { ApiError } from "@/lib/api/client";

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy>
      <LogoMark className="size-11 animate-pulse" />
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <TriangleAlert className="size-8 text-warning" />
      <div>
        <p className="font-semibold">Could not reach the server</p>
        <p className="text-muted-foreground">Check your connection and try again.</p>
      </div>
      <Button onClick={onRetry}>
        <RefreshCw /> Try again
      </Button>
    </div>
  );
}

/** Shown when Google access expired (Testing-mode tokens last 7 days) or was revoked. */
function ReconnectBanner() {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-warning/30 bg-warning/10 px-4 py-2 text-[13px]"
    >
      <TriangleAlert className="size-4 shrink-0 text-warning" />
      <span className="flex-1">Your Google connection expired, so new mail is not being synced.</span>
      <a href={LOGIN_URL} className="font-semibold text-foreground underline-offset-4 hover:underline">
        Reconnect Google
      </a>
    </div>
  );
}

function SetupBanner() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-primary/20 bg-primary/5 px-4 py-2 text-[13px]">
      <Sparkles className="size-4 shrink-0 text-primary" />
      <span className="flex-1">Finish setup so drafts sound like you and meetings follow your rules.</span>
      <Link href="/onboarding" className="font-semibold text-primary underline-offset-4 hover:underline">
        Finish setup
      </Link>
    </div>
  );
}

/** Signed-in layout: sidebar, top bar, banners, content, phone navigation. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useMe();
  const signedOut = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    if (signedOut) router.replace("/");
  }, [signedOut, router]);

  if (me.isPending || signedOut) return <Splash />;
  if (me.isError || !me.data) return <LoadError onRetry={() => void me.refetch()} />;

  return (
    <ChatProvider>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <div className="flex h-dvh overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar me={me.data} />
          {me.data.status === "needs_reconnect" && <ReconnectBanner />}
          {me.data.status === "active" && !me.data.onboarded && <SetupBanner />}
          <main
            id="main"
            tabIndex={-1}
            className="relative min-h-0 flex-1 overflow-hidden pb-14 outline-none md:pb-0"
          >
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
      <ChatPanel />
      <Shortcuts />
    </ChatProvider>
  );
}
