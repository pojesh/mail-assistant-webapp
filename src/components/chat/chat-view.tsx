"use client";

import { ArrowUp, CalendarDays, FileSearch, Inbox, PenLine, Sparkles, Square } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ChatMessage } from "@/components/chat/chat-message";
import { useChatContext } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: Inbox, text: "What needs my attention today?" },
  { icon: FileSearch, text: "Find the latest PDF someone sent me" },
  { icon: CalendarDays, text: "What's on my calendar this week?" },
  { icon: PenLine, text: "Draft a reply to my most important unread email" },
];

function EmptyChat({ onPick, compact }: { onPick: (text: string) => void; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-4 pt-6" : "gap-6 pt-[12vh]")}>
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.6_0.22_300)] text-primary-foreground shadow-lg shadow-primary/25"
      >
        <Sparkles className="size-6" />
      </motion.span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Ask about your mail and calendar</h2>
        <p className="mt-1 text-muted-foreground">
          Answers come with the emails they are based on. I can read, not send.
        </p>
      </div>
      <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, text }, index) => (
          <motion.button
            key={text}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => onPick(text)}
            className="flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-left text-[13px] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <Icon className="size-4 shrink-0 text-primary" /> {text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Composer() {
  const { send, streaming, stop } = useChatContext();
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => input.current?.focus(), []);

  function submit() {
    if (!text.trim() || streaming) return;
    void send(text);
    setText("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="relative rounded-2xl border bg-card shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5"
    >
      <textarea
        ref={input}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={2}
        maxLength={4000}
        placeholder="Ask anything about your inbox…"
        aria-label="Message"
        className="block max-h-40 w-full resize-none bg-transparent px-4 pb-11 pt-3 outline-none placeholder:text-muted-foreground"
      />
      <div className="absolute bottom-2 left-3 right-2 flex items-center">
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          Enter to send · Shift+Enter for a new line
        </span>
        {streaming ? (
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="ml-auto"
            onClick={stop}
            aria-label="Stop"
          >
            <Square className="size-3 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon-sm"
            className="ml-auto rounded-full"
            disabled={!text.trim()}
            aria-label="Send"
          >
            <ArrowUp />
          </Button>
        )}
      </div>
    </form>
  );
}

/** Messages + composer; used by the Chat page and the slide-over. */
export function ChatView({ compact = false }: { compact?: boolean }) {
  const { turns, send } = useChatContext();
  const bottom = useRef<HTMLDivElement>(null);
  const lastContent = turns.at(-1)?.content.length ?? 0;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, lastContent]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn("mx-auto space-y-6 px-4 py-6", compact ? "max-w-full" : "max-w-3xl")}
          aria-live="polite"
        >
          {turns.length === 0 ? (
            <EmptyChat onPick={(text) => void send(text)} compact={compact} />
          ) : (
            turns.map((turn) => <ChatMessage key={turn.id} turn={turn} />)
          )}
          <div ref={bottom} />
        </div>
      </div>
      <div className={cn("mx-auto w-full px-4 pb-4", compact ? "max-w-full" : "max-w-3xl")}>
        <Composer />
      </div>
    </div>
  );
}
