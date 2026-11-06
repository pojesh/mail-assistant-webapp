import { cn } from "@/lib/utils";

/** App mark: an envelope with a spark, drawn inline so it follows the theme colours. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.6_0.22_300)] text-primary-foreground shadow-sm shadow-primary/30",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[60%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path d="m3.5 7.5 8.5 6 8.5-6" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[oklch(0.85_0.15_85)] ring-2 ring-background" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>Mail Assistant</span>
    </span>
  );
}
