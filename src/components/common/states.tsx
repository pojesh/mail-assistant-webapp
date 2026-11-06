import { RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Icon + one helpful sentence + an optional action (spec §15.4). */
export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex animate-fade-up flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <div className="max-w-xs space-y-1">
        <p className="font-semibold">{title}</p>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {action}
    </div>
  );
}

/** Inline error with a retry button. */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      <TriangleAlert className="size-6 text-warning" />
      <p className="max-w-xs text-muted-foreground">{message ?? "Something went wrong while loading."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw /> Try again
        </Button>
      )}
    </div>
  );
}

/** Shimmering placeholder block. */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} aria-hidden />;
}

export function EmailListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul className="space-y-1 px-3 py-2" aria-busy aria-label="Loading emails">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="space-y-2 rounded-lg px-3 py-3" style={{ opacity: 1 - index * 0.08 }}>
          <div className="flex gap-3">
            <Shimmer className="h-3.5 w-32" />
            <Shimmer className="ml-auto h-3 w-10" />
          </div>
          <Shimmer className="h-3 w-4/5" />
          <Shimmer className="h-3 w-3/5" />
        </li>
      ))}
    </ul>
  );
}
