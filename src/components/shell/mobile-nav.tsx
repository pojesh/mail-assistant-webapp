"use client";

import { Menu } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDashboard } from "@/hooks/use-app-data";
import { NAV_ITEMS, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Phone navigation: four main tabs plus "More" for the rest. */
export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { data } = useDashboard();
  const main = NAV_ITEMS.filter((item) => item.mobile);
  const rest = NAV_ITEMS.filter((item) => !item.mobile);
  const restActive = rest.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-5">
          {main.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const badge = item.href === "/approvals" ? (data?.pending_approvals ?? 0) : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors",
                    active && "text-primary",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-active"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                    />
                  )}
                  <span className="relative">
                    <Icon className="size-5" />
                    {badge > 0 && (
                      <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                        {badge}
                      </span>
                    )}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground",
                restActive && "text-primary",
              )}
            >
              <Menu className="size-5" />
              More
            </button>
          </li>
        </ul>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <ul className="grid grid-cols-2 gap-2 px-4">
            {rest.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 font-medium transition-colors hover:bg-muted",
                      isActive(pathname, item.href) && "border-primary/40 bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 text-primary" /> {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
