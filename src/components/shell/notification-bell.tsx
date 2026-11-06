"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CalendarCheck2, CheckSquare, RotateCcw, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-app-data";
import { ApiError, api, unwrap, type Schemas } from "@/lib/api/client";
import { timeAgo } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type Notification = Schemas["NotificationItem"];

const ICONS: Record<string, typeof Bell> = {
  auto_action: CalendarCheck2,
  approval: CheckSquare,
  reconnect: TriangleAlert,
};

/** Undo an automatic calendar action (from a notification, toast or activity row). */
export function useUndoAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      unwrap(
        api.POST("/api/scheduling-actions/{action_id}/undo", { params: { path: { action_id: actionId } } }),
      ),
    onSuccess: (result) => toast.success(result.message),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not undo."),
    onSettled: () => {
      for (const key of [queryKeys.notifications, queryKeys.activity, queryKeys.dashboard, ["agenda"]]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

function NotificationRow({ item }: { item: Notification }) {
  const undo = useUndoAction();
  const Icon = ICONS[item.type] ?? Bell;
  return (
    <li className={cn("flex gap-3 px-4 py-3", !item.read && "bg-accent/40")}>
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-snug">
          {item.link ? (
            <Link href={item.link} className="hover:underline">
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </p>
        {item.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
          {item.can_undo && item.undo_action_id && (
            <Button
              size="xs"
              variant="outline"
              disabled={undo.isPending}
              onClick={() => undo.mutate(item.undo_action_id as string)}
            >
              <RotateCcw /> Undo
            </Button>
          )}
        </div>
      </div>
      {!item.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
    </li>
  );
}

/** Toast new automatic actions (with Undo) as they arrive; old ones stay quietly in the bell. */
function useAutoActionToasts(items: Notification[] | undefined) {
  const undo = useUndoAction();
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!items) return;
    if (seen.current === null) {
      seen.current = new Set(items.map((item) => item.id)); // first load: nothing is "new"
      return;
    }
    for (const item of items) {
      if (seen.current.has(item.id)) continue;
      seen.current.add(item.id);
      if (item.type !== "auto_action") continue;
      const actionId = item.undo_action_id;
      toast.success(item.title, {
        description: item.body,
        duration: 10_000,
        action:
          item.can_undo && actionId ? { label: "Undo", onClick: () => undo.mutate(actionId) } : undefined,
      });
    }
  }, [items, undo]);
}

export function NotificationBell() {
  const { data } = useNotifications();
  useAutoActionToasts(data?.items);
  const queryClient = useQueryClient();
  const markRead = useMutation({
    mutationFn: () => unwrap(api.POST("/api/notifications/read", { body: { ids: [] } })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
  const unread = data?.unread_count ?? 0;

  return (
    <Popover onOpenChange={(open) => !open && unread > 0 && markRead.mutate()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative"
        >
          <Bell />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-1 top-1 size-2 rounded-full bg-primary ring-2 ring-background"
              />
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          {unread > 0 && <span className="text-xs text-muted-foreground">{unread} new</span>}
        </div>
        {data && data.items.length > 0 ? (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {data.items.map((item) => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-muted-foreground">
            <Bell className="size-6" />
            <p className="text-sm">You are all caught up.</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
