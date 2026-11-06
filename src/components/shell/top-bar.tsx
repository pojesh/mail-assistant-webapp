"use client";

import { RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/brand/logo";
import { CommandPalette } from "@/components/shell/command-palette";
import { NotificationBell } from "@/components/shell/notification-bell";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSyncNow } from "@/hooks/use-app-data";
import type { Schemas } from "@/lib/api/client";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Re-render every 30 s so "Synced 2 min ago" stays true. */
function useTicker(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function SyncStatus({ lastSyncedAt }: { lastSyncedAt: string | null | undefined }) {
  const sync = useSyncNow();
  const now = useTicker();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="text-muted-foreground"
        >
          <RefreshCw className={cn(sync.isPending && "animate-spin")} />
          <span className="hidden sm:inline">
            {sync.isPending ? "Syncing…" : `Synced ${timeAgo(lastSyncedAt, now)}`}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Sync now (new mail is triaged by AI, about 10 seconds per email)</TooltipContent>
    </Tooltip>
  );
}

export function TopBar({ me }: { me: Schemas["MeResponse"] }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-xl sm:px-4">
      <Link href="/inbox" className="md:hidden" aria-label="Inbox">
        <LogoMark className="size-7" />
      </Link>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="group flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-left text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted sm:max-w-sm"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search or jump to…</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <SyncStatus lastSyncedAt={me.last_synced_at} />
        <NotificationBell />
        <ThemeToggle />
        <UserMenu me={me} />
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
