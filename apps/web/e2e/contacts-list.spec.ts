/**
 * Playwright smoke spec: Admin contacts list + saved views + legacy redirects.
 *
 * Auth note: This project does not yet have a Playwright e2e harness or auth
 * fixture (no playwright.config.ts, no global-setup, no stored auth state).
 * These tests are written and ready to run once the harness is in place.
 *
 * To wire up auth when the time comes:
 *   1. Add playwright.config.ts at apps/web/ pointing at http://localhost:4000
 *   2. Add e2e/global-setup.ts that logs in as an admin user via the Supabase
 *      magic-link or email+password flow and saves storageState to
 *      e2e/.auth/admin.json
 *   3. Set `use: { storageState: 'e2e/.auth/admin.json' }` in the project
 *      config so every test starts pre-authenticated as admin.
 *
 * Until then: `pnpm dlx playwright test e2e/contacts-list.spec.ts` will
 * report all four tests as failed/skipped (no server, no auth).
 */

import { test, expect } from '@playwright/test';

test.describe('Admin contacts list', () => {
  test('renders saved view tabs', async ({ page }) => {
    await page.goto('/admin/contacts');
    await expect(
      page.getByRole('navigation', { name: 'Saved views' }),
    ).toBeVisible();
    for (const label of ['All Contacts', 'Lead Pipeline', 'Active Owners']) {
      await expect(page.getByRole('link', { name: new RegExp(label) }))
        .toBeVisible();
    }
  });

  test('switching saved view updates URL', async ({ page }) => {
    await page.goto('/admin/contacts');
    await page.getByRole('link', { name: /Lead Pipeline/ }).click();
    await expect(page).toHaveURL(/view=lead-pipeline/);
  });

  test('redirects /admin/owners to active-owners view', async ({ page }) => {
    await page.goto('/admin/owners');
    await expect(page).toHaveURL('/admin/contacts?view=active-owners');
  });

  test('redirects /admin/leads to lead-pipeline view', async ({ page }) => {
    await page.goto('/admin/leads');
    await expect(page).toHaveURL('/admin/contacts?view=lead-pipeline');
  });
});
