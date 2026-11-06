"use client";

import { Check, ChevronsUpDown, Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { ZodType } from "zod";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WEEKDAYS, WEEKDAY_LABELS, timezones, type Weekday } from "@/lib/preferences-form";
import { cn } from "@/lib/utils";

/** Emails or domains as removable chips. Press Enter or comma to add; values are validated. */
export function ChipsInput({
  value,
  onChange,
  schema,
  placeholder,
  ariaLabel,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  schema: ZodType<string>;
  placeholder: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add(raw: string) {
    const entries = raw.split(/[\s,;]+/).filter(Boolean);
    const next = [...value];
    for (const entry of entries) {
      const parsed = schema.safeParse(entry);
      if (!parsed.success) {
        setError(`"${entry}": ${parsed.error.issues[0]?.message ?? "invalid"}`);
        return;
      }
      if (!next.includes(parsed.data)) next.push(parsed.data);
    }
    onChange(next);
    setDraft("");
    setError(null);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <AnimatePresence initial={false}>
          {value.map((item) => (
            <motion.span
              key={item}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(value.filter((entry) => entry !== item))}
                className="rounded text-accent-foreground/70 hover:text-accent-foreground"
              >
                <X className="size-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={draft}
          aria-label={ariaLabel}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
              event.preventDefault();
              add(draft);
            }
            if (event.key === "Backspace" && !draft && value.length > 0) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          className="h-6 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Mon–Sun toggle buttons. */
export function DayToggles({
  value,
  onChange,
  tone = "primary",
}: {
  value: Weekday[];
  onChange: (next: Weekday[]) => void;
  tone?: "primary" | "muted";
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {WEEKDAYS.map((day) => {
        const on = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((entry) => entry !== day) : [...value, day])}
            className={cn(
              "h-8 w-11 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-95",
              on
                ? tone === "primary"
                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "border-foreground/20 bg-foreground/10"
                : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {WEEKDAY_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}

/** Start and end clock times. */
export function TimeRangeInput({
  value,
  onChange,
  label,
}: {
  value: { start: string; end: string };
  onChange: (next: { start: string; end: string }) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="time"
        aria-label={`${label} start`}
        value={value.start}
        onChange={(event) => onChange({ ...value, start: event.target.value })}
        className="h-8 w-28"
      />
      <span className="text-muted-foreground">to</span>
      <Input
        type="time"
        aria-label={`${label} end`}
        value={value.end}
        onChange={(event) => onChange({ ...value, end: event.target.value })}
        className="h-8 w-28"
      />
    </div>
  );
}

/** A small − / + number input with a unit. */
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ariaLabel: string;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Decrease ${ariaLabel}`}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
      >
        <Minus />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(clamp(Number(event.target.value) || min))}
        className="h-7 w-16 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Increase ${ariaLabel}`}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
      >
        <Plus />
      </Button>
      {unit && <span className="ml-1 text-muted-foreground">{unit}</span>}
    </div>
  );
}

/** Searchable list of every IANA timezone. */
export function TimezonePicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const zones = useMemo(() => timezones(), []);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Timezone: ${value.replaceAll("_", " ")}`}
          className="w-full justify-between sm:w-72"
        >
          <span className="truncate">{value.replaceAll("_", " ")}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezones…" />
          <CommandList className="max-h-64">
            <CommandEmpty>No timezone found.</CommandEmpty>
            {zones.map((zone) => (
              <CommandItem
                key={zone}
                value={zone}
                onSelect={() => {
                  onChange(zone);
                  setOpen(false);
                }}
              >
                <Check className={cn("size-4", zone === value ? "opacity-100" : "opacity-0")} />
                {zone.replaceAll("_", " ")}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Big selectable cards with a title and explanation (used for the auto-scheduling level). */
export function ChoiceCards<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (next: T) => void;
  options: {
    value: T;
    title: string;
    text: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200",
              selected
                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/40"
                : "hover:border-primary/30 hover:bg-muted/40",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-colors",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="font-semibold">{option.title}</span>
              {option.badge && (
                <span className="ml-auto rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                  {option.badge}
                </span>
              )}
            </span>
            <span className="text-[13px] text-muted-foreground">{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}
