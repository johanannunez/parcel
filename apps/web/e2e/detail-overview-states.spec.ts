import { test, expect } from "@playwright/test";

test("Lead contact renders Lead Overview", async ({ page }) => {
  // Requires a seeded lead contact — skip if not present (Plan F adds seeds)
  await page.goto("/admin/contacts?view=lead-pipeline");
  const row = page.locator('a[href^="/admin/owners/"]').first();
  if ((await row.count()) === 0) {
    test.skip(true, "no lead seed yet");
    return;
  }
  await row.click();
  await expect(page.getByText(/Opportunity/i)).toBeVisible();
});

test("Dormant contact renders Dormant Overview", async ({ page }) => {
  await page.goto("/admin/contacts?view=churned");
  const row = page.locator('a[href^="/admin/owners/"]').first();
  if ((await row.count()) === 0) {
    test.skip(true, "no churned seed yet");
    return;
  }
  await row.click();
  await expect(page.getByText(/Relationship/i)).toBeVisible();
});

test("Right rail shows ACTIVITY header and LIVE badge on detail", async ({
  page,
}) => {
  await page.goto("/admin/contacts?view=active-owners");
  const row = page.locator('a[href^="/admin/owners/"]').first();
  if ((await row.count()) === 0) {
    test.skip(true, "no owner");
    return;
  }
  await row.click();
  await expect(
    page.getByRole("complementary", { name: "Recent activity" }),
  ).toBeVisible();
  await expect(page.getByText("LIVE")).toBeVisible();
});
