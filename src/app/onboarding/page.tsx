"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LogoMark } from "@/components/brand/logo";
import { ErrorState } from "@/components/common/states";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useMe } from "@/hooks/use-me";
import { usePreferences } from "@/hooks/use-preferences";
import { ApiError } from "@/lib/api/client";

export default function OnboardingPage() {
  const router = useRouter();
  const me = useMe();
  const preferences = usePreferences();
  const signedOut = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    if (signedOut) router.replace("/");
  }, [signedOut, router]);

  if (me.isError && !signedOut)
    return <ErrorState onRetry={() => void me.refetch()} className="min-h-dvh justify-center" />;
  if (preferences.isError)
    return <ErrorState onRetry={() => void preferences.refetch()} className="min-h-dvh justify-center" />;
  if (!me.data || !preferences.data)
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LogoMark className="size-11 animate-pulse" />
      </div>
    );
  return <OnboardingWizard me={me.data} initial={preferences.data} />;
}
