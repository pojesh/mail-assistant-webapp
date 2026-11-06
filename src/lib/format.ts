/** Small, dependency-free date and text helpers (Intl does the localisation). */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" });

/** "just now", "5 min ago", "3 hr ago", "yesterday", "4 days ago". */
export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "never";
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  if (abs < MINUTE) return "just now";
  if (abs < HOUR) return relative.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return relative.format(Math.round(diff / HOUR), "hour");
  return relative.format(Math.round(diff / DAY), "day");
}

/** Inbox list time: "14:05" today, "Mon" this week, "3 Nov" this year, "3 Nov 2025" otherwise. */
export function listTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (now.getTime() - date.getTime() < 6 * DAY)
    return date.toLocaleDateString(undefined, { weekday: "short" });
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "Tue 11 Nov, 14:05" */
export function fullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Tue 11 Nov · 10:00–10:30" */
export function timeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time(start)}–${time(end)}`;
}

/** Display name for a sender: their name, else the part of the address before @. */
export function senderName(name: string | null | undefined, email: string): string {
  const clean = name?.replace(/^['"]|['"]$/g, "").trim();
  return clean || email.split("@")[0];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
