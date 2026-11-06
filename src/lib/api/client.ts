/**
 * The one typed API client. Paths and response types come from the generated
 * `schema.d.ts` (`pnpm gen:api`) — never write response types by hand.
 */
import createClient, { type Middleware } from "openapi-fetch";

import type { components, paths } from "./schema";

export type Schemas = components["schemas"];

/** A safe, user-facing error from the API (`{error: {code, message}}`). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const CSRF_COOKIE = "csrf_token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/** Double-submit CSRF: echo the readable cookie in a header on state-changing requests. */
const csrf: Middleware = {
  onRequest({ request }) {
    const token = readCookie(CSRF_COOKIE);
    if (token && !SAFE_METHODS.has(request.method)) request.headers.set("X-CSRF-Token", token);
    return request;
  },
};

// NOTE: the server's OpenAPI paths already start with /api, so baseUrl is this origin;
// requests go to /api/* here, which the Next.js route handler proxies to API_URL.
export const api = createClient<paths>({ baseUrl: "", credentials: "same-origin" });
api.use(csrf);

/** Turn any failed response into an ApiError with the server's message. */
export function toApiError(status: number, body: unknown): ApiError {
  const error = (body as { error?: { code?: string; message?: string } } | undefined)?.error;
  if (error?.message) return new ApiError(status, error.code ?? "error", error.message);
  if (status === 0) return new ApiError(0, "network_error", "You appear to be offline.");
  return new ApiError(status, "error", "Something went wrong. Please try again.");
}

/** Unwrap an openapi-fetch result: return data, or throw an ApiError. */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result: Awaited<typeof call>;
  try {
    result = await call;
  } catch {
    throw toApiError(0, undefined);
  }
  if (result.error !== undefined || !result.response.ok)
    throw toApiError(result.response.status, result.error);
  return result.data as T;
}

export { readCookie };
