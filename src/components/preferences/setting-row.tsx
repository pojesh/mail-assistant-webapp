import { cn } from "@/lib/utils";

/** Label + explanation on the left, the control on the right (stacked on phones). */
export function SettingRow({
  label,
  description,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  description?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2 py-4 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-6", className)}>
      <div>
        <label htmlFor={htmlFor} className="font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">
        {children}
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** A titled card that groups settings. */
export function SettingsCard({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border bg-card px-5 py-1 shadow-sm sm:px-6">
      <header className="flex items-start gap-3 border-b py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className="divide-y">{children}</div>
    </section>
  );
}
