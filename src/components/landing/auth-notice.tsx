"use client";

import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useMe } from "@/hooks/use-me";

const MESSAGES: Record<string, string> = {
  access_denied: "Sign-in was cancelled. You can try again whenever you are ready.",
  invalid_state: "That sign-in link expired. Please try again.",
  sign_in_failed: "Google sign-in failed. Please try again.",
  missing_permissions:
    "Please allow access to Gmail and Calendar on the Google screen — the assistant needs both to work.",
};

/** Explains sign-in errors (?auth_error=...) and sends signed-in users straight to the app. */
export function AuthNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const me = useMe();
  const error = params.get("auth_error");

  useEffect(() => {
    if (me.data) router.replace(me.data.onboarded ? "/inbox" : "/onboarding");
  }, [me.data, router]);

  if (!error) return null;
  return (
    <div
      role="alert"
      className="mx-auto mb-8 flex max-w-xl animate-fade-up items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <p>{MESSAGES[error] ?? MESSAGES.sign_in_failed}</p>
    </div>
  );
}
