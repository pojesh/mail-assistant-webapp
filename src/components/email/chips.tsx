import { ShieldAlert } from "lucide-react";

import { CATEGORIES, SENTIMENTS, type Category, type Sentiment } from "@/lib/categories";
import { cn } from "@/lib/utils";

const CHIP =
  "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none ring-1 ring-inset";

export function CategoryChip({ category, className }: { category: Category; className?: string }) {
  const meta = CATEGORIES[category];
  const Icon = meta.icon;
  return (
    <span className={cn(CHIP, meta.className, className)}>
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </span>
  );
}

export function SentimentChip({ sentiment, className }: { sentiment: Sentiment; className?: string }) {
  const meta = SENTIMENTS[sentiment];
  const Icon = meta.icon;
  return (
    <span className={cn(CHIP, meta.className, className)}>
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </span>
  );
}

export function SuspiciousChip({ className }: { className?: string }) {
  return (
    <span className={cn(CHIP, "bg-destructive/10 text-destructive ring-destructive/25", className)}>
      <ShieldAlert className="size-3" aria-hidden />
      Suspicious
    </span>
  );
}

/** Priority 1–5 as filled dots, with a text label for screen readers. */
export function PriorityDots({ priority, className }: { priority: number; className?: string }) {
  const tone = priority >= 4 ? "bg-destructive" : priority === 3 ? "bg-warning" : "bg-muted-foreground/60";
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Priority ${priority} of 5`}
    >
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            level <= priority ? tone : "bg-muted-foreground/15",
          )}
        />
      ))}
    </span>
  );
}
