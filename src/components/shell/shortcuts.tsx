"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useChatContext } from "@/components/chat/chat-provider";
import { isTyping } from "@/components/inbox/email-list";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

/** "g" followed by one of these keys jumps to a page. */
const GO_TO: Record<string, string> = {
  i: "/inbox",
  a: "/approvals",
  c: "/calendar",
  h: "/chat",
  f: "/files",
  p: "/preferences",
  y: "/activity",
  s: "/settings",
};

const HELP: { keys: string[]; text: string }[] = [
  { keys: ["⌘", "K"], text: "Command palette" },
  { keys: ["⌘", "J"], text: "Ask your inbox (chat)" },
  { keys: ["J"], text: "Next email" },
  { keys: ["K"], text: "Previous email" },
  { keys: ["D"], text: "Draft a reply to the open email" },
  { keys: ["T"], text: "Find a time for the open email" },
  { keys: ["A"], text: "Go to Approvals" },
  { keys: ["G", "I"], text: "Go to Inbox" },
  { keys: ["G", "C"], text: "Go to Calendar" },
  { keys: ["G", "H"], text: "Go to Chat" },
  { keys: ["G", "F"], text: "Go to Files" },
  { keys: ["G", "P"], text: "Go to Preferences" },
  { keys: ["G", "Y"], text: "Go to Activity" },
  { keys: ["G", "S"], text: "Go to Settings" },
  { keys: ["?"], text: "Show this list" },
];

/** App-wide keyboard shortcuts (spec §15.4) and the "?" help dialog. */
export function Shortcuts() {
  const router = useRouter();
  const { panelOpen, setPanelOpen } = useChatContext();
  const [helpOpen, setHelpOpen] = useState(false);
  const waitingForG = useRef<number | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "j" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPanelOpen(!panelOpen);
        return;
      }
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (waitingForG.current !== null) {
        window.clearTimeout(waitingForG.current);
        waitingForG.current = null;
        if (GO_TO[key]) {
          event.preventDefault();
          router.push(GO_TO[key]);
        }
        return;
      }
      if (key === "g") {
        waitingForG.current = window.setTimeout(() => (waitingForG.current = null), 1200);
      } else if (key === "a") {
        router.push("/approvals");
      } else if (event.key === "?") {
        setHelpOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, panelOpen, setPanelOpen]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Work through your inbox without the mouse.</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-1.5">
          {HELP.map((item) => (
            <li key={item.text} className="flex items-center justify-between text-[13px]">
              <span>{item.text}</span>
              <span className="flex gap-1">
                {item.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
