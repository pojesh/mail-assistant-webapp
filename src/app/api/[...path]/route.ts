/**
 * Runtime proxy: every /api/* request is forwarded to the FastAPI server at API_URL.
 *
 * Why: the browser only ever talks to this origin, so the session cookie is first-party,
 * and the server URL is read at request time (never baked into the build).
 * Bodies are streamed in both directions, which keeps chat (SSE) responses live.
 */
import type { NextRequest } from "next/server";

// Headers that describe a single connection and must not be forwarded.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
  "te",
  "trailer",
  "host",
  "content-length",
]);
// fetch() already decompressed the upstream body, so these would be wrong.
const DROP_FROM_RESPONSE = new Set([...HOP_BY_HOP, "content-encoding", "set-cookie"]);

function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set");
  return url.replace(/\/$/, "");
}

function forwardedHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  const clientIp = request.headers.get("x-forwarded-for") ?? "";
  headers.set("x-forwarded-for", clientIp);
  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  return headers;
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!DROP_FROM_RESPONSE.has(key.toLowerCase())) headers.set(key, value);
  });
  // Several Set-Cookie headers must stay separate (session + CSRF cookies).
  for (const cookie of upstream.headers.getSetCookie()) headers.append("set-cookie", cookie);
  return headers;
}

async function proxy(request: NextRequest): Promise<Response> {
  const target = `${apiUrl()}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const hasBody = !["GET", "HEAD"].includes(request.method);
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: forwardedHeaders(request),
      body: hasBody ? request.body : undefined,
      redirect: "manual", // pass OAuth redirects (303 to Google) straight to the browser
      cache: "no-store",
      // Required by Node's fetch to stream a request body.
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders(upstream),
    });
  } catch {
    const error = {
      error: { code: "api_unreachable", message: "The server is not reachable. Please try again." },
    };
    return Response.json(error, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
