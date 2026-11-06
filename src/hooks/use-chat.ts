"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { ApiError, api, unwrap, type Schemas } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { streamEvents } from "@/lib/sse";

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps: Schemas["ChatStep"][];
  citations: Schemas["Citation"][];
  status: "done" | "streaming" | "error";
};

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));

export function useChatSessions() {
  return useQuery({ queryKey: queryKeys.chatSessions, queryFn: () => unwrap(api.GET("/api/chat/sessions")) });
}

/**
 * One conversation: sends a question, streams the assistant's steps and answer into the last
 * turn, and keeps the server's session id so follow-up questions have context.
 */
export function useChat() {
  const queryClient = useQueryClient();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const updateLast = (change: (turn: ChatTurn) => ChatTurn) =>
    setTurns((current) => current.map((turn, index) => (index === current.length - 1 ? change(turn) : turn)));

  const send = useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || streaming) return;
      const controller = new AbortController();
      abort.current = controller;
      setStreaming(true);
      setTurns((current) => [
        ...current,
        { id: newId(), role: "user", content: text, steps: [], citations: [], status: "done" },
        { id: newId(), role: "assistant", content: "", steps: [], citations: [], status: "streaming" },
      ]);
      try {
        const body = { message: text, session_id: sessionId };
        for await (const event of streamEvents("/api/chat", body, controller.signal)) {
          if (event.type === "step")
            updateLast((turn) => ({
              ...turn,
              steps: [...turn.steps, { tool: event.tool, label: event.label }],
            }));
          else if (event.type === "token")
            updateLast((turn) => ({ ...turn, content: turn.content + event.text }));
          else if (event.type === "done") {
            setSessionId(event.session_id);
            updateLast((turn) => ({
              ...turn,
              id: event.message_id,
              content: event.content,
              citations: event.citations,
              status: "done",
            }));
          } else {
            updateLast((turn) => ({ ...turn, content: event.message, status: "error" }));
          }
        }
        updateLast((turn) => (turn.status === "streaming" ? { ...turn, status: "done" } : turn));
      } catch (error) {
        const text = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
        updateLast((turn) => ({ ...turn, content: text, status: "error" }));
      } finally {
        setStreaming(false);
        abort.current = null;
        void queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions });
      }
    },
    [sessionId, streaming, queryClient],
  );

  const stop = useCallback(() => abort.current?.abort(), []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setTurns([]);
    setSessionId(null);
  }, []);

  /** Open an earlier conversation from history. */
  const load = useCallback(
    async (id: string) => {
      abort.current?.abort();
      const detail = await queryClient.fetchQuery({
        queryKey: queryKeys.chatSession(id),
        queryFn: () =>
          unwrap(api.GET("/api/chat/sessions/{session_id}", { params: { path: { session_id: id } } })),
      });
      setSessionId(id);
      setTurns(detail.messages.map((message) => ({ ...message, status: "done" as const })));
    },
    [queryClient],
  );

  return { turns, sessionId, streaming, send, stop, reset, load };
}
