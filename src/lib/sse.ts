/**
 * Server-Sent Events over a POST request (EventSource only supports GET).
 * Reads the response body as a stream and yields one parsed event per `data:` block.
 */
import { readCookie, toApiError, type Schemas } from "@/lib/api/client";

export type ChatStreamEvent = Schemas["ChatStreamEvent"];

/** Split a chunked text stream into complete SSE blocks (separated by a blank line). */
async function* sseBlocks(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replaceAll("\r\n", "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        yield buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim()) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

/** The JSON payload of one SSE block (its `data:` lines joined), or null for comments/pings. */
export function parseBlock(block: string): ChatStreamEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return null;
  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch {
    return null;
  }
}

/** POST JSON to an SSE endpoint and yield its events. Throws ApiError if the request fails. */
export async function* streamEvents(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
  const csrf = readCookie("csrf_token");
  if (csrf) headers["X-CSRF-Token"] = csrf;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
      credentials: "same-origin",
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") return;
    throw toApiError(0, undefined);
  }
  if (!response.ok || !response.body) {
    const errorBody = await response.json().catch(() => undefined);
    throw toApiError(response.status, errorBody);
  }
  for await (const block of sseBlocks(response.body)) {
    const event = parseBlock(block);
    if (event) yield event;
  }
}
