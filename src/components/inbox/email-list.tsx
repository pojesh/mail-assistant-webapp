"use client";

import { Inbox, Loader2, RefreshCw, SearchX } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { EmailListSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { EmailRow } from "@/components/inbox/email-row";
import { InboxFilters } from "@/components/inbox/inbox-filters";
import { Button } from "@/components/ui/button";
import { useSyncNow } from "@/hooks/use-app-data";
import { useEmailFilters, useEmails } from "@/hooks/use-emails";
import { ApiError } from "@/lib/api/client";

/** True when the user is typing, so single-key shortcuts must not fire. */
export function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return (
    !!element && (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName))
  );
}

export function EmailList() {
  const filters = useEmailFilters();
  const emails = useEmails(filters);
  const sync = useSyncNow();
  const router = useRouter();
  const search = useSearchParams().toString();
  const { id: selectedId } = useParams<{ id?: string }>();
  const sentinel = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLAnchorElement>());

  const items = useMemo(() => emails.data?.pages.flatMap((page) => page.items) ?? [], [emails.data]);
  const hrefFor = (id: string) => `/inbox/${id}${search ? `?${search}` : ""}`;
  const hasFilters = Object.values(filters).some((value) => value !== undefined);

  // Infinite scroll: load the next page when the sentinel comes into view.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = emails;
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // j / k move through the list (spec §15.4); the open email follows the selection.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "j" && event.key !== "k") return;
      if (items.length === 0) return;
      const index = items.findIndex((item) => item.id === selectedId);
      const nextIndex = event.key === "j" ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);
      const next = items[index === -1 ? 0 : nextIndex];
      router.push(hrefFor(next.id), { scroll: false });
      rowRefs.current.get(next.id)?.scrollIntoView({ block: "nearest" });
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hrefFor only depends on `search`
  }, [items, selectedId, router, search]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InboxFilters />
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {emails.isPending ? (
          <EmailListSkeleton />
        ) : emails.isError ? (
          <ErrorState
            message={emails.error instanceof ApiError ? emails.error.message : undefined}
            onRetry={() => void emails.refetch()}
          />
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No emails match"
              text="Try another filter or clear the search."
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="Your inbox is empty"
              text="Sync to bring in your newest mail. Each email is triaged by AI as it arrives."
              action={
                <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
                  <RefreshCw className={sync.isPending ? "animate-spin" : undefined} /> Sync now
                </Button>
              }
            />
          )
        ) : (
          <ul className="py-1" aria-label="Emails">
            {items.map((email, index) => (
              <EmailRow
                key={email.id}
                ref={(node) => {
                  if (node) rowRefs.current.set(email.id, node);
                  else rowRefs.current.delete(email.id);
                }}
                email={email}
                href={hrefFor(email.id)}
                selected={email.id === selectedId}
                index={index}
              />
            ))}
          </ul>
        )}
        <div ref={sentinel} className="flex h-12 items-center justify-center">
          {isFetchingNextPage && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}
