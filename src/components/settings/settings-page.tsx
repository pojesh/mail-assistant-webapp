"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Link2Off, Loader2, Monitor, Moon, Palette, Sun, Trash2, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { LOGIN_URL } from "@/components/landing/google-button";
import { SettingRow, SettingsCard } from "@/components/preferences/setting-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { ApiError, api, unwrap } from "@/lib/api/client";
import { initials, senderName } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const PROVIDERS = { google: "Google Gemini", groq: "Groq" } as const;
const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function DisconnectButton() {
  const queryClient = useQueryClient();
  const disconnect = useMutation({
    mutationFn: () => unwrap(api.POST("/api/account/disconnect")),
    onSuccess: () => toast.success("Google disconnected. Your synced data is kept until you delete it."),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not disconnect."),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  });
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disconnect.isPending}>
          {disconnect.isPending ? <Loader2 className="animate-spin" /> : <Link2Off />} Disconnect Google
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Google?</AlertDialogTitle>
          <AlertDialogDescription>
            The assistant stops reading new mail and loses access to your calendar. Your synced emails and
            settings stay here until you delete them, and you can reconnect at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => disconnect.mutate()}>Disconnect</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteAccountButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE("/api/account", { body: { confirm: "delete" } })),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/");
      toast.success("All your data was deleted.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not delete your data."),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirm("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 /> Delete all my data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete all your data?</DialogTitle>
          <DialogDescription>
            This removes your synced emails, AI insights, drafts waiting for approval, preferences, notes,
            chat history and activity, and disconnects Google. It cannot be undone. Your Gmail and Calendar
            are not touched.
          </DialogDescription>
        </DialogHeader>
        <label className="space-y-1.5">
          <span className="text-[13px]">
            Type <span className="font-mono font-semibold">delete</span> to confirm
          </span>
          <Input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
            aria-label="Confirmation"
          />
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={confirm.trim().toLowerCase() !== "delete" || remove.isPending}
            onClick={() => remove.mutate()}
          >
            {remove.isPending && <Loader2 className="animate-spin" />} Delete everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsPage() {
  const me = useMe();
  const { theme, setTheme } = useTheme();
  if (!me.data) return null;
  const name = senderName(me.data.name, me.data.email);
  const connected = me.data.status === "active";
  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Your account, connection and data.</p>
        </header>

        <SettingsCard icon={UserRound} title="Account">
          <div className="flex items-center gap-4 py-4">
            <Avatar className="size-12">
              {me.data.picture_url && (
                <AvatarImage src={me.data.picture_url} alt="" referrerPolicy="no-referrer" />
              )}
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{name}</p>
              <p className="truncate text-muted-foreground">{me.data.email}</p>
            </div>
            <Badge className={connected ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
              {connected ? "Google connected" : "Needs reconnect"}
            </Badge>
          </div>
          <SettingRow
            label="Google connection"
            description="Gmail (read, labels, drafts) and Google Calendar."
          >
            {connected ? (
              <DisconnectButton />
            ) : (
              <Button asChild>
                <a href={LOGIN_URL}>Reconnect Google</a>
              </Button>
            )}
          </SettingRow>
        </SettingsCard>

        <SettingsCard icon={Bot} title="AI model">
          <SettingRow label="Provider" description="Set by the server administrator.">
            <span className="inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-[13px] font-medium">
              <Bot className="size-4 text-primary" /> {PROVIDERS[me.data.llm_provider]}
            </span>
          </SettingRow>
        </SettingsCard>

        <SettingsCard icon={Palette} title="Appearance">
          <SettingRow label="Theme">
            <div role="radiogroup" aria-label="Theme" className="inline-grid grid-cols-3 gap-2">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={theme === value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all",
                    theme === value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/40"
                      : "text-muted-foreground hover:border-primary/30",
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          </SettingRow>
        </SettingsCard>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/[0.03] p-5 sm:p-6">
          <h2 className="font-semibold text-destructive">Danger zone</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Permanently delete everything the assistant stores about you. Your Gmail and Calendar are not
            changed.
          </p>
          <div className="mt-4">
            <DeleteAccountButton />
          </div>
        </section>
      </div>
    </div>
  );
}
