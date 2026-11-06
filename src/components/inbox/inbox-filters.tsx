"use client";

import { MailOpen, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { CATEGORIES, CATEGORY_ORDER, SENTIMENTS } from "@/lib/categories";

const ALL = "all";

/** Update one URL search param (keeps the others), without adding a history entry. */
function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "" || value === ALL) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, params],
  );
}

function SearchBox() {
  const params = useSearchParams();
  const setParam = useSetParam();
  const [value, setValue] = useState(params.get("q") ?? "");

  // Debounce typing: search 300 ms after the last keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (value === current) return;
    const id = window.setTimeout(() => setParam("q", value.trim() || null), 300);
    return () => window.clearTimeout(id);
  }, [value, params, setParam]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search subject or sender"
        aria-label="Search emails"
        className="h-8 pl-8 pr-7"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function InboxFilters() {
  const params = useSearchParams();
  const setParam = useSetParam();
  return (
    <div className="space-y-2 border-b px-3 py-2.5">
      <SearchBox />
      <div className="flex flex-wrap items-center gap-1.5">
        <Select value={params.get("category") ?? ALL} onValueChange={(value) => setParam("category", value)}>
          <SelectTrigger size="sm" className="h-7 gap-1 text-xs" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {CATEGORY_ORDER.map((key) => (
              <SelectItem key={key} value={key}>
                {CATEGORIES[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={params.get("priority") ?? ALL} onValueChange={(value) => setParam("priority", value)}>
          <SelectTrigger size="sm" className="h-7 gap-1 text-xs" aria-label="Minimum priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any priority</SelectItem>
            {[5, 4, 3, 2].map((level) => (
              <SelectItem key={level} value={String(level)}>
                Priority {level}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.get("sentiment") ?? ALL}
          onValueChange={(value) => setParam("sentiment", value)}
        >
          <SelectTrigger size="sm" className="h-7 gap-1 text-xs" aria-label="Sentiment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any mood</SelectItem>
            {Object.entries(SENTIMENTS).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Toggle
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xs"
          pressed={params.get("unread") === "1"}
          onPressedChange={(pressed) => setParam("unread", pressed ? "1" : null)}
          aria-label="Unread only"
        >
          <MailOpen className="size-3.5" /> Unread
        </Toggle>
      </div>
    </div>
  );
}
