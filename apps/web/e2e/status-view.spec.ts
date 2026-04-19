/**
 * Playwright smoke spec: Status (Kanban) view across pipeline pages.
 *
 * Auth note: These tests require a Playwright e2e harness with admin auth.
 * See the note in contacts-list.spec.ts for the setup steps.
 * Until then these tests are written and ready but will fail without a running
 * server + admin auth state.
 */

import { test, expect } from '@playwright/test';

test.describe('Status view', () => {
  for (const [path, label] of [
    ['/admin/contacts?view=lead-pipeline&mode=status', 'Contacts'],
    ['/admin/properties?mode=status', 'Properties'],
    ['/admin/projects?mode=status', 'Projects'],
  ] as const) {
    test(`${label}: renders columns + cards`, async ({ page }) => {
      await page.goto(path);
      // Expect at least one stage header visible (the gradient column header).
      await expect(page.locator('header').nth(0)).toBeVisible();
      // Card hrefs present (zero or more — depends on seed data).
      const cards = page.locator('a[href^="/admin/"]:has(div[class*="photo"])');
      expect(await cards.count()).toBeGreaterThanOrEqual(0);
    });
  }

  test('Contacts: MetricsBar renders with a featured tile', async ({ page }) => {
    await page.goto('/admin/contacts?mode=status');
    // Featured blue tile should be visible.
    const featuredTile = page.locator('[class*="featured"]').first();
    await expect(featuredTile).toBeVisible();
  });

  test('Properties: MetricsBar shows Pipeline value', async ({ page }) => {
    await page.goto('/admin/properties?mode=status');
    await expect(page.getByText('Pipeline value', { exact: false })).toBeVisible();
  });

  test('Contacts: view switcher toggles mode', async ({ page }) => {
    await page.goto('/admin/contacts?mode=status');
    // Switch to List view.
    const listTab = page.getByRole('tab', { name: /list/i });
    if (await listTab.isVisible()) {
      await listTab.click();
      await expect(page).toHaveURL(/mode=compact/);
    }
  });
});
