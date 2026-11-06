import { cn } from "@/lib/utils";

/** Server route that starts Google OAuth. Needs a full page load, so plain <a> links are used. */
export const LOGIN_URL = "/api/auth/google/login";

/** "Continue with Google" — a full-page navigation into the server's OAuth flow. */
export function GoogleButton({
  className,
  label = "Continue with Google",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={LOGIN_URL}
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-3 rounded-xl bg-foreground px-5 text-sm font-medium text-background shadow-lg shadow-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"
        />
        <path
          fill="#34A853"
          d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.5 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z"
        />
        <path
          fill="#EA4335"
          d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2.1 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z"
        />
      </svg>
      {label}
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </a>
  );
}
