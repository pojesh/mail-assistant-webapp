"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api/client";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Do not retry errors the user has to act on (sign in, reconnect, not found).
        retry: (failures, error) => {
          if (error instanceof ApiError && [400, 401, 403, 404, 409, 422].includes(error.status))
            return false;
          return failures < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

/** Theme, server-state cache, tooltips, toasts, and reduced-motion support for the whole app. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user" transition={{ type: "spring", bounce: 0, duration: 0.25 }}>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </TooltipProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
