import {
  Activity,
  CalendarDays,
  CheckSquare,
  FolderOpen,
  Inbox,
  MessagesSquare,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string; // shown in the command palette (handled in components/shell/shortcuts.tsx)
  /** Shown in the phone bottom bar (the rest live under "More"). */
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/inbox", label: "Inbox", icon: Inbox, shortcut: "G I", mobile: true },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, shortcut: "A", mobile: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, shortcut: "G C", mobile: true },
  { href: "/chat", label: "Chat", icon: MessagesSquare, shortcut: "⌘J", mobile: true },
  { href: "/files", label: "Files", icon: FolderOpen, shortcut: "G F" },
  { href: "/preferences", label: "Preferences", icon: SlidersHorizontal, shortcut: "G P" },
  { href: "/activity", label: "Activity", icon: Activity, shortcut: "G Y" },
  { href: "/settings", label: "Settings", icon: Settings, shortcut: "G S" },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
