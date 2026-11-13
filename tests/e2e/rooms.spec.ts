import { test, expect } from '@playwright/test';

test('creates rooms, joins by link and code, shares among three browsers, and isolates rooms', async ({
  browser,
}) => {
  const contexts = await Promise.all(
    Array.from({ length: 4 }, () =>
      browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] }),
    ),
  );
  try {
    const [a, b, c, separate] = await Promise.all(contexts.map((context) => context.newPage()));
    await a.goto('/');
    await a.getByRole('button', { name: 'Create new room' }).click();
    await expect(a).toHaveURL(/\/room\/[0-9a-f-]{36}$/);
    const roomUrl = a.url();
    const roomCode = new URL(roomUrl).pathname.split('/').pop()!;
    await expect(a.getByRole('textbox', { name: 'Room link', exact: true })).toHaveValue(roomUrl);
    await a.getByRole('button', { name: 'Copy link', exact: true }).click();
    expect(await a.evaluate(() => navigator.clipboard.readText())).toBe(roomUrl);
    const editorA = a.getByRole('textbox', { name: 'Clipboard text' });
    await editorA.fill('Room alpha');
    await expect(a.locator('.sync-status')).not.toHaveText('Sharing…');

    await b.goto('/');
    await b.getByLabel('Join a room', { exact: true }).fill(roomUrl);
    await b.getByRole('button', { name: 'Join room', exact: true }).click();
    await expect(b).toHaveURL(roomUrl);
    const editorB = b.getByRole('textbox', { name: 'Clipboard text' });
    await expect(editorB).toHaveValue('Room alpha');

    await c.goto('/');
    await c.getByLabel('Join a room', { exact: true }).fill(roomCode);
    await c.getByRole('button', { name: 'Join room', exact: true }).click();
    const editorC = c.getByRole('textbox', { name: 'Clipboard text' });
    await expect(editorC).toHaveValue('Room alpha');
    await expect(a.locator('.participant-count')).toHaveText('3 people here');
    await editorC.fill('A contribution from the third browser');
    await expect(editorA).toHaveValue('A contribution from the third browser');
    await expect(editorB).toHaveValue('A contribution from the third browser');

    await separate.goto('/');
    await separate.getByRole('button', { name: 'Create new room' }).click();
    await expect(separate).toHaveURL(/\/room\/[0-9a-f-]{36}$/);
    expect(separate.url()).not.toBe(roomUrl);
    const isolatedEditor = separate.getByRole('textbox', { name: 'Clipboard text' });
    await expect(isolatedEditor).toHaveValue('');
    await expect(separate.locator('.participant-count')).toHaveText('1 person here');
    await isolatedEditor.fill('Only in room beta');
    await expect(separate.locator('.sync-status')).not.toHaveText('Sharing…');
    await b.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(editorA).toHaveValue('');
    await expect(editorC).toHaveValue('');
    await expect(isolatedEditor).toHaveValue('Only in room beta');
    await editorB.fill('Still in room alpha');
    await expect(editorA).toHaveValue('Still in room alpha');
    await expect(isolatedEditor).toHaveValue('Only in room beta');

    await a.reload();
    await expect(editorA).toHaveValue('Still in room alpha');
    await a.setViewportSize({ width: 375, height: 812 });
    expect(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await a.screenshot({ path: '/tmp/pasteclip-room-mobile.png', fullPage: true });
    await a.setViewportSize({ width: 1280, height: 1000 });
    await a.screenshot({ path: '/tmp/pasteclip-room-desktop.png', fullPage: true });

    await a.close();
    await b.close();
    await c.close();
    const reopened = await contexts[0].newPage();
    await reopened.goto(roomUrl);
    await expect(reopened.getByRole('textbox', { name: 'Clipboard text' })).toHaveValue('');
    await expect(reopened.locator('.participant-count')).toHaveText('1 person here');
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

test('invalid room links show an error without connecting to a shared room', async ({ page }) => {
  const sockets: string[] = [];
  page.on('websocket', (socket) => sockets.push(socket.url()));
  await page.goto('/room/not-a-valid-id');
  await expect(page.getByRole('heading', { name: 'That room link isn’t valid.' })).toBeVisible();
  expect(sockets.filter((url) => url.includes('supabase'))).toEqual([]);
  await page.getByRole('link', { name: 'Back to Pasteclip' }).click();
  await page
    .getByLabel('Join a room', { exact: true })
    .fill('https://another-site.test/room/not-valid');
  await page.getByRole('button', { name: 'Join room', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Enter a valid room code or a room link from this site.',
  );
});
