/** Pure helpers for the week view: which days to show and where each event box goes. */

export type TimedItem = { key: string; start: Date; end: Date };
export type PlacedItem<T extends TimedItem> = T & { lane: number; lanes: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday 00:00 (local time) of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Minutes since local midnight. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Side-by-side lanes for overlapping events in one day: each event gets the first free lane,
 * and every event in an overlapping cluster shares the cluster's lane count.
 */
export function layoutDay<T extends TimedItem>(items: T[]): PlacedItem<T>[] {
  const sorted = [...items].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime(),
  );
  const placed: PlacedItem<T>[] = [];
  let cluster: PlacedItem<T>[] = [];
  let clusterEnd = 0;
  let laneEnds: number[] = [];

  const closeCluster = () => {
    for (const item of cluster) item.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    const start = item.start.getTime();
    if (cluster.length > 0 && start >= clusterEnd) closeCluster();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = item.end.getTime();
    const entry = { ...item, lane, lanes: 1 };
    cluster.push(entry);
    placed.push(entry);
    clusterEnd = Math.max(clusterEnd, item.end.getTime());
  }
  closeCluster();
  return placed;
}

/** Visible hour range: at least 08:00–20:00, stretched to fit every event. */
export function hourRange(items: TimedItem[]): { first: number; last: number } {
  let first = 8;
  let last = 20;
  for (const item of items) {
    first = Math.min(first, item.start.getHours());
    last = Math.max(last, item.end.getHours() + (item.end.getMinutes() > 0 ? 1 : 0));
  }
  return { first: Math.max(0, first), last: Math.min(24, Math.max(last, first + 1)) };
}

export function isMultiDay(start: Date, end: Date): boolean {
  return end.getTime() - start.getTime() >= DAY_MS || !sameDay(start, new Date(end.getTime() - 1));
}
