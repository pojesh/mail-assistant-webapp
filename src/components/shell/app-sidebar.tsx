"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { useDashboard } from "@/hooks/use-app-data";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import { NAV_ITEMS, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

function CountBadge({ value, tone = "muted" }: { value: number; tone?: "muted" | "primary" }) {
  if (!value) return null;
  return (
    <span
      className={cn(
        "ml-auto min-w-5 rounded-full px-1.5 text-center text-[11px] font-medium tabular-nums leading-5",
        tone === "primary" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

/** Inbox category shortcuts with 7-day counts. */
function CategoryLinks() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { data } = useDashboard();
  const current = pathname.startsWith("/inbox") ? params.get("category") : null;
  return (
    <ul className="mt-1 space-y-0.5 pl-3" aria-label="Inbox categories">
      {CATEGORY_ORDER.map((key) => {
        const meta = CATEGORIES[key];
        const active = current === key;
        return (
          <li key={key}>
            <Link
              href={active ? "/inbox" : `/inbox?category=${key}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-7 items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
              {meta.label}
              <CountBadge value={data?.by_category[key] ?? 0} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop navigation. The active item's highlight glides between items (motion layoutId). */
export function AppSidebar() {
  const pathname = usePathname();
  const { data } = useDashboard();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center px-4">
        <Link href="/inbox" className="rounded-lg focus-visible:outline-2">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Main" className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 font-medium text-sidebar-foreground/80 transition-colors duration-150 hover:text-sidebar-foreground",
                    active && "text-sidebar-accent-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 -z-10 rounded-lg bg-sidebar-accent"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                  {item.href === "/approvals" && (
                    <CountBadge value={data?.pending_approvals ?? 0} tone="primary" />
                  )}
                </Link>
                {item.href === "/inbox" && <CategoryLinks />}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
