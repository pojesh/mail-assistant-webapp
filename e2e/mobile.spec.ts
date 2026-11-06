import { expect, test } from "@playwright/test";

import { mockApi } from "./mock-api";

test("phone: list, then email, then back, with the bottom tab bar", async ({ page }) => {
  await mockApi(page);
  await page.goto("/inbox");
  const nav = page.getByRole("navigation", { name: "Main" }).last();
  await expect(nav.getByRole("link", { name: /Approvals/ })).toBeVisible();

  await page.getByRole("list", { name: "Emails" }).getByText("Q3 report review").click();
  await expect(page.getByRole("heading", { name: "Q3 report review" })).toBeVisible();
  await page.getByRole("link", { name: "Back to inbox" }).click();
  await expect(page.getByRole("list", { name: "Emails" })).toBeVisible();
});
