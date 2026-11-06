"use client";

import { Monitor, Moon, RefreshCw, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useSyncNow } from "@/hooks/use-app-data";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import { NAV_ITEMS } from "@/lib/nav";

/** ⌘K / Ctrl+K: jump anywhere, filter the inbox, sync, switch theme. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const sync = useSyncNow();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a page or run an action"
    >
      {/* shadcn v4's CommandDialog does not include the cmdk root: <Command> provides the store. */}
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Go to">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.href} onSelect={() => run(() => router.push(item.href))}>
                  <Icon /> {item.label}
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Inbox">
            {CATEGORY_ORDER.map((key) => {
              const meta = CATEGORIES[key];
              const Icon = meta.icon;
              return (
                <CommandItem
                  key={key}
                  value={`filter ${meta.label}`}
                  onSelect={() => run(() => router.push(`/inbox?category=${key}`))}
                >
                  <Icon /> Show {meta.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run(() => sync.mutate())}>
              <RefreshCw /> Sync now
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("light"))}>
              <Sun /> Light theme
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}>
              <Moon /> Dark theme
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("system"))}>
              <Monitor /> System theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
