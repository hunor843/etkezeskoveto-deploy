import { expect, test } from '@playwright/test';

test('happy path: login then create and delete a forum topic', async ({ page }) => {
  const unique = Date.now();
  const title = `E2E téma ${unique}`;
  const body = `E2E nyitó üzenet ${unique} - legalább 10 karakter.`;

  // Start on forum page; if not logged in, it offers a login link.
  await page.goto('/forum');
  await expect(page.getByRole('heading', { name: 'Fórum' })).toBeVisible();

  await page.getByRole('link', { name: 'Bejelentkezés' }).click();
  await expect(page.getByRole('heading', { name: 'Bejelentkezés' })).toBeVisible();

  await page.locator('#login-email').fill('hunor@example.com');
  await page.locator('#login-password').fill('Hunor1234');
  await page.locator('form').locator('button[type="submit"]').click();

  // Should redirect back to /forum (returnUrl)
  await expect(page).toHaveURL(/\/forum/);

  // Create a topic
  await page.locator('#topic-title').fill(title);
  await page.locator('#topic-body').fill(body);
  await page.getByRole('button', { name: 'Téma létrehozása' }).click();

  // Navigates to the topic detail page
  await expect(page).toHaveURL(/\/forum\/.+/);
  await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  await expect(page.getByText(body)).toBeVisible();

  // Delete the topic (owner can delete)
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Téma törlése' }).click();

  await expect(page).toHaveURL(/\/forum$/);
  await expect(page.getByRole('heading', { name: 'Fórum' })).toBeVisible();

  // Ensure the topic is no longer listed
  await expect(page.locator('.topic-title', { hasText: title })).toHaveCount(0);
});
