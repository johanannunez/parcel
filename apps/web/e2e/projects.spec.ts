import { test, expect } from '@playwright/test';

test('Projects page renders with saved view tabs', async ({ page }) => {
  await page.goto('/admin/projects');
  await expect(page.getByRole('navigation', { name: 'Saved views' })).toBeVisible();
  for (const label of ['All Projects', 'Idea Board', 'Feature Builds']) {
    await expect(page.getByRole('link', { name: new RegExp(label) })).toBeVisible();
  }
});

test('Create project via + New and see it in list', async ({ page }) => {
  await page.goto('/admin/projects');
  await page.getByRole('button', { name: /\+/ }).first().click();
  await page.getByRole('button', { name: 'Project' }).click();
  await page.getByLabel('Name').fill('TEST · Playwright Project');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByText('TEST · Playwright Project')).toBeVisible();
});

test('Project detail renders 5 tabs', async ({ page }) => {
  await page.goto('/admin/projects');
  const firstLink = page.locator('a[href^="/admin/projects/"]').first();
  await firstLink.click();
  for (const label of ['Overview', 'Tasks', 'Activity', 'Files', 'Settings']) {
    await expect(page.getByRole('link', { name: label })).toBeVisible();
  }
});
