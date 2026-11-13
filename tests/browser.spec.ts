import { test, expect } from '@playwright/test';

test('two visitors can paste, copy, clear, and reply; mobile has no overflow', async ({ browser }) => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  let clip = { content: '', revision: 0, updated_at: new Date().toISOString() };
  await context.route('https://clipboard-test.supabase.co/rest/v1/**', async route => {
    if (route.request().url().includes('/rpc/')) {
      clip = { content: route.request().postDataJSON().new_content, revision: clip.revision + 1, updated_at: new Date().toISOString() };
    }
    await route.fulfill({ json: clip });
  });
  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto('/'); await second.goto('/');
  const firstText = first.getByRole('textbox', { name: 'Clipboard text' });
  const secondText = second.getByRole('textbox', { name: 'Clipboard text' });
  await firstText.fill('Hello from the first browser');
  await expect.poll(() => clip.content).toBe('Hello from the first browser');
  await second.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(secondText).toHaveValue(clip.content);
  await second.getByRole('button', { name: 'Copy text' }).click();
  await expect(second.getByRole('button', { name: 'Copied!' })).toBeVisible();
  expect(await second.evaluate(() => navigator.clipboard.readText())).toBe(clip.content);
  await second.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect.poll(() => clip.content).toBe('');
  await first.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(firstText).toHaveValue('');
  await secondText.fill('A reply from the second browser');
  await expect.poll(() => clip.content).toBe('A reply from the second browser');
  await first.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(firstText).toHaveValue(clip.content);
  await first.reload();
  await expect(firstText).toHaveValue(clip.content);
  await first.screenshot({ path: '/tmp/pasteclip-desktop.png', fullPage: true });
  await first.setViewportSize({ width: 375, height: 812 });
  expect(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await first.screenshot({ path: '/tmp/pasteclip-mobile.png', fullPage: true });
  await context.close();
});
