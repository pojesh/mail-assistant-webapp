/**
 * A typed, in-browser mock of the server API for end-to-end tests. Fixtures use the generated
 * schema types, so a contract change breaks these tests at compile time.
 */
import type { Page, Route } from "@playwright/test";

import type { components } from "../src/lib/api/schema";

type S = components["schemas"];

const iso = (offsetDays: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const me: S["MeResponse"] = {
  id: "u1",
  email: "pat@example.com",
  name: "Pat Lee",
  picture_url: null,
  status: "active",
  onboarded: true,
  llm_provider: "google",
  last_synced_at: iso(0, 9),
};

const insight = (overrides: Partial<S["InsightBrief"]> = {}): S["InsightBrief"] => ({
  category: "action_required",
  priority: 4,
  sentiment: "neutral",
  sentiment_score: 0.9,
  summary: "Priya asks for comments on the Q3 report by Friday.",
  needs_reply: true,
  suspicious: false,
  has_meeting_intent: false,
  ...overrides,
});

export const emails: S["EmailListItem"][] = [
  {
    id: "e1",
    thread_id: "t1",
    from_email: "priya@acme.com",
    from_name: "Priya Shah",
    subject: "Q3 report review",
    snippet: "Could you review…",
    received_at: iso(0, 9, 30),
    is_unread: true,
    has_attachments: true,
    has_invite: false,
    insight: insight(),
  },
  {
    id: "e2",
    thread_id: "t2",
    from_email: "news@tldr.tech",
    from_name: "TLDR",
    subject: "New GPU announced",
    snippet: "Daily tech news",
    received_at: iso(0, 8),
    is_unread: false,
    has_attachments: false,
    has_invite: false,
    insight: insight({
      category: "newsletter",
      priority: 1,
      summary: "Daily tech newsletter.",
      needs_reply: false,
    }),
  },
];

export const emailDetail: S["EmailDetail"] = {
  ...emails[0],
  gmail_id: "g1",
  to: ["pat@example.com"],
  cc: [],
  body_text: "Hi Pat,\n\nCould you review the attached Q3 report by Friday?\n\nThanks,\nPriya",
  body_html: null,
  is_sent: false,
  invite: null,
  insight: {
    ...insight(),
    thread_summary: null,
    action_items: [{ task: "Review the Q3 report", due: null }],
    meeting_intent: null,
    suspicious_reasons: [],
    model: "test-model",
    provider: "google",
  },
  attachments: [
    {
      id: "f1",
      email_id: "e1",
      filename: "Q3-report.pdf",
      mime_type: "application/pdf",
      size_bytes: 248_000,
      sender_email: "priya@acme.com",
      sender_name: "Priya Shah",
      subject: "Q3 report review",
      received_at: iso(0, 9, 30),
    },
  ],
  thread: [],
  scheduling: null,
};

export const draftApproval: S["ApprovalOut"] = {
  id: "a1",
  kind: "draft",
  status: "pending",
  email_id: "e1",
  created_at: iso(0, 9, 35),
  decided_at: null,
  result: null,
  warnings: [],
  payload: {
    email: {
      subject: "Q3 report review",
      from_email: "priya@acme.com",
      from_name: "Priya Shah",
      received_at: iso(0, 9, 30),
    },
    summary: "Priya asks for comments on the Q3 report by Friday.",
    variants: [
      { label: "Short", body: "Hi Priya,\n\nWill do, comments by Friday.\n\nBest,\nPat" },
      {
        label: "Detailed",
        body: "Hi Priya,\n\nThanks! I'll review the Q3 report and send detailed comments by Friday.\n\nBest,\nPat",
      },
    ],
    slots: [],
  },
};

export const agenda: S["AgendaResponse"] = {
  events: [
    {
      id: "ev1",
      summary: "Design review",
      start: iso(0, 14),
      end: iso(0, 15),
      all_day: false,
      transparent: false,
      auto_added: true,
      action_id: "sa1",
      undo_until: iso(1, 9),
      my_response: "accepted",
      attendees: ["a@acme.com"],
    },
  ],
  proposals: [],
};

export const dashboard: S["DashboardResponse"] = {
  window_days: 7,
  total: 2,
  unread: 1,
  by_category: { action_required: 1, newsletter: 1 },
  by_sentiment: { neutral: 2 },
  priority_queue: [],
  pending_approvals: 1,
  auto_actions_today: 1,
  suspicious: 0,
};

/** What the mocked server received (for assertions). */
export type Recorded = { decisions: unknown[]; undos: string[]; chats: unknown[] };

const SSE = (events: S["ChatStreamEvent"][]) =>
  events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");

/** Install the mock API on a page. `signedIn: false` makes /api/me answer 401. */
export async function mockApi(page: Page, options: { signedIn?: boolean } = {}): Promise<Recorded> {
  const recorded: Recorded = { decisions: [], undos: [], chats: [] };
  let pending = [draftApproval];
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === "/api/me") {
      return options.signedIn === false
        ? json(route, { error: { code: "unauthorized", message: "Please sign in." } }, 401)
        : json(route, me);
    }
    if (path === "/api/emails") return json(route, { items: emails, next_cursor: null });
    if (path === "/api/emails/e1") return json(route, emailDetail);
    if (path === "/api/dashboard") return json(route, dashboard);
    if (path === "/api/digest/today") return json(route, null);
    if (path === "/api/notifications") return json(route, { items: [], unread_count: 0 });
    if (path === "/api/calendar/agenda") return json(route, agenda);
    if (path === "/api/chat/sessions") return json(route, []);
    if (path === "/api/approvals" && method === "GET") {
      const status = url.searchParams.get("status");
      return json(route, { items: status === "pending" ? pending : [] });
    }
    if (path === "/api/approvals/a1/decide") {
      recorded.decisions.push(request.postDataJSON());
      pending = [];
      const approval = { ...draftApproval, status: "approved", result: { draft_id: "d1" } };
      return json(route, {
        approval,
        outcome: "done",
        message: "Done. Drafts are in Gmail → Drafts; nothing was sent.",
      });
    }
    if (path.startsWith("/api/scheduling-actions/") && path.endsWith("/undo")) {
      recorded.undos.push(path.split("/")[3]);
      return json(route, { id: "sa1", undone: true, message: "Event removed." });
    }
    if (path === "/api/chat") {
      recorded.chats.push(request.postDataJSON());
      const body = SSE([
        { type: "step", tool: "search_threads", label: "Searching mail…" },
        { type: "step", tool: "get_thread", label: "Reading the conversation…" },
        { type: "token", text: "Priya wants your comments " },
        { type: "token", text: "on the **Q3 report** by Friday." },
        {
          type: "done",
          session_id: "s1",
          message_id: "m1",
          content: "Priya wants your comments on the **Q3 report** by Friday.",
          citations: [{ thread_id: "t1", subject: "Q3 report review", email_id: "e1" }],
          steps: [
            { tool: "search_threads", label: "Searching mail…" },
            { tool: "get_thread", label: "Reading the conversation…" },
          ],
        },
      ]);
      return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body });
    }
    // Anything unexpected fails loudly, so a test never silently talks to a real server.
    return json(route, { error: { code: "not_mocked", message: `${method} ${path} is not mocked` } }, 500);
  });
  return recorded;
}
