import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { mockApi } from "./mock-api";

test("landing page explains the product and offers Google sign-in", async ({ page }) => {
  await mockApi(page, { signedIn: false });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your inbox, triaged.");
  await expect(page.getByRole("link", { name: /Continue with Google/ })).toHaveAttribute(
    "href",
    "/api/auth/google/login",
  );
});

test("signed-out visitors are sent back to the landing page", async ({ page }) => {
  await mockApi(page, { signedIn: false });
  await page.goto("/inbox");
  await expect(page).toHaveURL("/");
});

test("inbox shows AI-triaged mail and opens an email with its summary", async ({ page }) => {
  await mockApi(page);
  await page.goto("/inbox");
  const list = page.getByRole("list", { name: "Emails" });
  await expect(list.getByText("Q3 report review")).toBeVisible();
  await expect(list.getByText("Newsletter", { exact: true })).toBeVisible();

  await page.keyboard.press("j"); // first email
  await expect(page).toHaveURL(/\/inbox\/e1/);
  await expect(page.getByText("AI summary").first()).toBeVisible();
  await expect(page.getByText("Review the Q3 report").first()).toBeVisible();
  await expect(page.getByText("Q3-report.pdf")).toBeVisible();
});

test("approving an edited draft sends the edit and clears the card", async ({ page }) => {
  const recorded = await mockApi(page);
  await page.goto("/approvals");
  await page.getByRole("tab", { name: "Detailed" }).click();
  const editor = page.getByRole("textbox", { name: "Reply text" });
  await editor.fill("Hi Priya,\n\nComments coming on Thursday.\n\nBest,\nPat");
  await page.getByRole("button", { name: "Save to Gmail drafts" }).click();

  await expect(page.getByText("Nothing is waiting for you")).toBeVisible();
  await expect(page.getByText(/nothing was sent/)).toBeVisible();
  expect(recorded.decisions).toEqual([
    {
      action: "approve",
      variant_index: 1,
      edited_body: "Hi Priya,\n\nComments coming on Thursday.\n\nBest,\nPat",
    },
  ]);
});

test("an automatically added event can be undone from the calendar", async ({ page }) => {
  const recorded = await mockApi(page);
  await page.goto("/calendar");
  await page
    .getByRole("button", { name: /Design review/ })
    .first()
    .click();
  await expect(page.getByText("Added or accepted automatically by the assistant.")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Event removed.")).toBeVisible();
  expect(recorded.undos).toEqual(["sa1"]);
});

test("chat streams its steps, the answer and citations", async ({ page }) => {
  const recorded = await mockApi(page);
  await page.goto("/chat");
  await page.getByRole("textbox", { name: "Message" }).fill("What does Priya need?");
  await page.keyboard.press("Enter");

  await expect(page.getByText("Q3 report", { exact: true })).toBeVisible(); // bold Markdown
  await expect(page.getByRole("link", { name: "Q3 report review" })).toHaveAttribute("href", "/inbox/e1");
  await page.getByRole("button", { name: /2 steps/ }).click();
  await expect(page.getByText("Reading the conversation…")).toBeVisible();
  expect(recorded.chats).toEqual([{ message: "What does Priya need?", session_id: null }]);
});

test("keyboard: ? shows the shortcuts and ⌘K opens the command palette", async ({ page }) => {
  await mockApi(page);
  await page.goto("/inbox");
  await expect(page.getByRole("list", { name: "Emails" })).toBeVisible();
  await page.keyboard.press("Shift+Slash");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  await expect(page.getByPlaceholder("Type a command or search…")).toBeVisible();
});

for (const path of ["/", "/inbox", "/approvals", "/preferences", "/settings"]) {
  test(`no serious accessibility problems on ${path}`, async ({ page }) => {
    await mockApi(page, { signedIn: path !== "/" });
    if (path === "/preferences") {
      await page.route("**/api/preferences", (route) =>
        route.fulfill({
          json: {
            tone: "friendly",
            language: "English",
            sign_off: "Best",
            signature: "Pat",
            timezone: "UTC",
            vip_senders: [],
            meeting_preferences: {
              working_days: ["mon", "tue", "wed", "thu", "fri"],
              working_hours: { start: "09:30:00", end: "18:00:00" },
              no_meeting_days: [],
              focus_blocks: [],
              lunch_break: { start: "13:00:00", end: "14:00:00" },
              buffer_minutes: 10,
              min_notice_hours: 4,
              max_meetings_per_day: 6,
              search_horizon_days: 10,
              preferred_times: ["morning"],
              default_duration_minutes: 30,
              add_video_link: true,
              auto_schedule: "trusted",
              trusted_domains: [],
              auto_actions_per_day: 5,
              undo_window_hours: 24,
              vip_can_override_focus: false,
            },
          },
        }),
      );
      await page.route("**/api/preferences/notes", (route) => route.fulfill({ json: [] }));
      await page.route("**/api/onboarding/vip-suggestions", (route) => route.fulfill({ json: [] }));
    }
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200); // let entrance animations finish
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (item) => item.impact === "serious" || item.impact === "critical",
    );
    const report = serious.flatMap((item) =>
      item.nodes
        .slice(0, 4)
        .map(
          (node) =>
            `${item.id} :: ${node.target.join(" ")} :: ${(node.any[0]?.message ?? node.html).slice(0, 160)}`,
        ),
    );
    expect(report).toEqual([]);
  });
}
