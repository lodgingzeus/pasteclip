import { test, expect } from '@playwright/test';

test('Supabase broadcasts without WebRTC share text, clear, copy, rejoin, and forget after all pages close', async ({ browser }) => {
  test.setTimeout(240000);
  const started = Date.now();
  const progress = (step: string) => console.log(`${step}: ${Math.round((Date.now() - started) / 1000)}s`);
  const a = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const b = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const first = await a.newPage();
  const second = await b.newPage();
  await a.addInitScript(() => { Object.defineProperty(window, 'RTCPeerConnection', { value: undefined }); });
  await b.addInitScript(() => { Object.defineProperty(window, 'RTCPeerConnection', { value: undefined }); });
  await first.goto('/');
  const firstText = first.getByRole('textbox', { name: 'Clipboard text' });
  await firstText.fill('Hello from device one');
  await expect(first.getByText('Sharing…', { exact: true })).toHaveCount(0);
  progress('first draft ready');
  await second.goto('/');
  const secondText = second.getByRole('textbox', { name: 'Clipboard text' });
  await expect(secondText).toHaveValue('Hello from device one');
  progress('peers connected and synced');
  await second.getByRole('button', { name: 'Copy text' }).click();
  expect(await second.evaluate(() => navigator.clipboard.readText())).toBe('Hello from device one');
  await second.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(firstText).toHaveValue('');
  await secondText.fill('Reply from device two');
  await expect(firstText).toHaveValue('Reply from device two');
  progress('copy, clear, reply passed');
  await first.reload();
  await expect(firstText).toHaveValue('Reply from device two');
  progress('rejoin passed');
  const large = 'Text 📝 '.repeat(20000);
  await firstText.evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, large);
  await expect.poll(async () => (await secondText.inputValue()) === large).toBe(true);
  progress('large text passed');
  await a.setOffline(true);
  await firstText.fill('Draft while offline');
  await expect(first.getByText('This browser is offline.', { exact: false })).toBeVisible();
  await a.setOffline(false);
  await expect(secondText).toHaveValue('Draft while offline');
  progress('offline recovery passed');
  await first.setViewportSize({ width: 375, height: 812 });
  expect(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await a.close(); await b.close();
  const fresh = await browser.newPage();
  await fresh.goto('/');
  await expect(fresh.getByRole('textbox', { name: 'Clipboard text' })).toHaveValue('');
  await fresh.close();
});


test('a disconnected service reports failure and reconnect keeps text', async ({ browser }) => {
  const context = await browser.newContext();
  await context.routeWebSocket(/^wss:/, socket => socket.close());
  const page = await context.newPage();
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Clipboard text' });
  await editor.fill('Keep this while reconnecting');
  await expect(page.getByText('Could not connect to the sharing service.', { exact: false })).toBeVisible();
  await page.getByText('Connection details', { exact: true }).click();
  await expect(page.getByText('Sharing service: Disconnected', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Reconnect', exact: true }).click();
  await expect(editor).toHaveValue('Keep this while reconnecting');
  await context.close();
});
