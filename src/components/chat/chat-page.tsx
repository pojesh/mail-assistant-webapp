"use client";

import { MessageSquarePlus, MessagesSquare } from "lucide-react";

import { ChatView } from "@/components/chat/chat-view";
import { useChatContext } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import { useChatSessions } from "@/hooks/use-chat";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Earlier conversations (desktop sidebar). */
function History() {
  const sessions = useChatSessions();
  const { sessionId, load, reset } = useChatContext();
  return (
    <aside
      aria-label="Conversations"
      className="hidden w-64 shrink-0 flex-col border-r bg-sidebar/50 lg:flex"
    >
      <div className="p-3">
        <Button variant="outline" className="w-full justify-start" onClick={reset}>
          <MessageSquarePlus /> New conversation
        </Button>
      </div>
      <ul className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {(sessions.data ?? []).map((session) => (
          <li key={session.session_id}>
            <button
              type="button"
              onClick={() => void load(session.session_id)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted",
                session.session_id === sessionId && "bg-accent text-accent-foreground",
              )}
            >
              <span className="block truncate text-[13px] font-medium">{session.title}</span>
              <span className="text-[11px] text-muted-foreground">{timeAgo(session.updated_at)}</span>
            </button>
          </li>
        ))}
        {sessions.data?.length === 0 && (
          <li className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <MessagesSquare className="size-3.5" /> No conversations yet
          </li>
        )}
      </ul>
    </aside>
  );
}

export function ChatPage() {
  const { turns, reset } = useChatContext();
  return (
    <div className="flex h-full min-h-0">
      <History />
      <div className="relative min-w-0 flex-1">
        {turns.length > 0 && (
          <Button variant="ghost" size="sm" className="absolute right-3 top-3 z-10 lg:hidden" onClick={reset}>
            <MessageSquarePlus /> New
          </Button>
        )}
        <ChatView />
      </div>
    </div>
  );
}
