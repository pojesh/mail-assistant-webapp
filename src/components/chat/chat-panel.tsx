"use client";

import { Maximize2, MessageSquarePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChatView } from "@/components/chat/chat-view";
import { useChatContext } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** ⌘J slide-over: ask a question without leaving the page you are on. */
export function ChatPanel() {
  const { panelOpen, setPanelOpen, reset } = useChatContext();
  const pathname = usePathname();
  if (pathname.startsWith("/chat")) return null; // the full page is already open
  return (
    <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md" showCloseButton={false}>
        <SheetHeader className="flex-row items-center gap-2 border-b px-4 py-3">
          <Sparkles className="size-4 text-primary" />
          <SheetTitle className="flex-1">Ask your inbox</SheetTitle>
          <SheetDescription className="sr-only">
            Chat with the assistant about your mail and calendar.
          </SheetDescription>
          <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="New conversation">
            <MessageSquarePlus />
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/chat" onClick={() => setPanelOpen(false)} aria-label="Open full chat page">
              <Maximize2 />
            </Link>
          </Button>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <ChatView compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
