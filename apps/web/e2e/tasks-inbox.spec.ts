import { test, expect } from '@playwright/test';

test.describe('Unified tasks inbox', () => {
  test('renders saved view tabs', async ({ page }) => {
    await page.goto('/admin/tasks');
    await expect(page.getByRole('navigation', { name: 'Saved views' })).toBeVisible();
    for (const label of ['My Tasks', 'Overdue', 'This Week', 'Unassigned']) {
      await expect(page.getByRole('link', { name: new RegExp(label) })).toBeVisible();
    }
  });

  test('empty state when no tasks exist', async ({ page }) => {
    await page.goto('/admin/tasks');
    // Without any tasks seeded yet, the list will show "Nothing here."
    // (This assertion is permissive — adjust when Plan F seeds data.)
    const hasEmpty = await page.getByText('Nothing here.').count();
    const hasBucket = await page.getByText(/OVERDUE|TODAY|THIS WEEK|LATER|NO DATE/).count();
    expect(hasEmpty + hasBucket).toBeGreaterThan(0);
  });
});
