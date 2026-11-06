"use client";

import { Check, Lightbulb, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Shimmer } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNoteMutations, useNotes } from "@/hooks/use-preferences";
import type { Schemas } from "@/lib/api/client";

type Note = Schemas["PreferenceNoteOut"];

function NoteEditor({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [text, setText] = useState(initial);
  const valid = text.trim().length >= 3;
  return (
    <div className="space-y-2">
      <Textarea
        autoFocus
        value={text}
        rows={2}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && valid) onSave(text.trim());
          if (event.key === "Escape") onCancel();
        }}
        placeholder="e.g. When clients ask for discounts, say I need to check with finance."
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={!valid || saving} onClick={() => onSave(text.trim())}>
          <Check /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function NoteRow({ note }: { note: Note }) {
  const { update, remove } = useNoteMutations();
  const [editing, setEditing] = useState(false);
  const suggested = note.status === "suggested";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className={suggested ? "rounded-xl border border-primary/30 bg-primary/5 p-3" : "rounded-xl border p-3"}
    >
      {editing ? (
        <NoteEditor
          initial={note.text}
          saving={update.isPending}
          onCancel={() => setEditing(false)}
          onSave={(text) => update.mutate({ id: note.id, text }, { onSuccess: () => setEditing(false) })}
        />
      ) : (
        <div className="flex items-start gap-3">
          {suggested ? (
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          ) : (
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-relaxed">{note.text}</p>
            {suggested && (
              <p className="mt-1 text-xs text-muted-foreground">
                Learned from how you edited a draft. Keep it?
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {suggested ? (
              <>
                <Button size="xs" onClick={() => update.mutate({ id: note.id, status: "active" })}>
                  <Check /> Keep
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => update.mutate({ id: note.id, status: "rejected" })}
                >
                  <X /> Dismiss
                </Button>
              </>
            ) : (
              <>
                {note.source === "learned" && <Badge variant="secondary">Learned</Badge>}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Edit note"
                  onClick={() => setEditing(true)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Delete note"
                  onClick={() => remove.mutate(note.id)}
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </motion.li>
  );
}

/** "What I've learned": free-text rules the assistant follows, and suggestions to accept or dismiss. */
export function NotesSection() {
  const notes = useNotes();
  const { create } = useNoteMutations();
  const [adding, setAdding] = useState(false);
  const visible = (notes.data ?? []).filter((note) => note.status !== "rejected");
  const suggested = visible.filter((note) => note.status === "suggested");
  const active = visible.filter((note) => note.status === "active");

  if (notes.isPending)
    return (
      <div className="space-y-2 py-4">
        <Shimmer className="h-12 w-full" />
        <Shimmer className="h-12 w-full" />
      </div>
    );

  return (
    <div className="space-y-4 py-4">
      {suggested.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Suggestions ({suggested.length})
          </p>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {suggested.map((note) => (
                <NoteRow key={note.id} note={note} />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {active.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </AnimatePresence>
      </ul>
      {active.length === 0 && !adding && (
        <p className="text-[13px] text-muted-foreground">
          No notes yet. Add standing answers or rules, like how you handle discount requests or who to copy on
          invoices.
        </p>
      )}
      {adding ? (
        <NoteEditor
          initial=""
          saving={create.isPending}
          onCancel={() => setAdding(false)}
          onSave={(text) => create.mutate(text, { onSuccess: () => setAdding(false) })}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus /> Add a note
        </Button>
      )}
    </div>
  );
}
