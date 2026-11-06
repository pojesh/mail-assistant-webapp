"use client";

import { createContext, useContext, useState } from "react";

import { useChat } from "@/hooks/use-chat";

type ChatContextValue = ReturnType<typeof useChat> & {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/** One conversation shared by the Chat page and the ⌘J slide-over. */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const chat = useChat();
  const [panelOpen, setPanelOpen] = useState(false);
  return <ChatContext.Provider value={{ ...chat, panelOpen, setPanelOpen }}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChatContext must be used inside <ChatProvider>");
  return value;
}
