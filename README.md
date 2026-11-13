# Pasteclip

One page, one shared clipboard. Paste or type text and everyone visiting the page sees it update. Copy the text, clear it, or replace it with a reply. No accounts or separate rooms.

Built with React, TypeScript, Vite, and Supabase (Postgres + Realtime). Vercel serves the frontend; Supabase stores the shared text and delivers live updates across devices.

## Setup

1. Install Node.js 22.12+ and run `npm ci`.
2. Create a Supabase project at https://supabase.com.
3. Open its SQL Editor and run [`supabase/setup.sql`](supabase/setup.sql). This creates the single clipboard row, public read/write access, and the realtime publication.
4. Copy `.env.example` to `.env.local` and set:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
   ```

   Find these in the project's Connect dialog / API settings. A legacy anon key also works. Use only a publishable or anon key; never put a secret or service-role key in a `VITE_` variable, since those values are bundled into the browser.
5. Run `npm run dev` and open the printed URL on two browsers. Type in one, copy in the other, then clear and reply. Reload either page to confirm persistence.

Without these settings, the page displays setup guidance and disables editing. It does not pretend that browser-local data is shared.

## Deploy to Vercel

1. Import `lodgingzeus/pasteclip` into Vercel.
2. Select the **Vite** preset, with build command `npm run build` and output directory `dist`.
3. Add both environment variables above to the appropriate Vercel environments.
4. Deploy. If you change environment variables, redeploy because Vite embeds them at build time.
5. Open the deployed HTTPS URL on two devices and check the paste → copy → clear → reply flow.

No custom Vercel server or WebSocket function is needed. All visitors of deployments using the same Supabase project share the same clipboard, including preview deployments. Use a separate Supabase project for isolated testing.

## Behavior

- Changes save automatically after a 300 ms typing pause.
- The clipboard persists after every visitor leaves.
- Realtime events refresh the shared row; a 10-second reconciliation and tab-focus refresh recover missed updates.
- Writes from each client are serialized; server revisions prevent stale responses from replacing newer content.
- Simultaneous writers use last successful write wins. This is a shared clipboard, not a collaborative document editor that merges keystrokes.
- Failed saves retain the draft in the open tab and show a retry button. The page warns before closing with unsaved changes; drafts are not persisted locally.
- Copy uses the browser Clipboard API on HTTPS or localhost, with manual selection as a fallback.
- No app-imposed text length limit or input `maxlength`. Database, request, browser memory, and provider quotas still apply. Large text is fetched from the database rather than relying on realtime payload contents.
- This clipboard is intentionally public: anyone with the URL can read, overwrite, or clear it. It has no authentication, history, moderation, or rate limiting. Do not use it for private information.

## Checks

```sh
npm test
npm run build
```

Tests exercise two-client sharing, persistence for late visitors, clearing, retry after a failed write, write ordering, and large content using an in-memory transport. They do not replace testing against your configured Supabase project.

For browser checks, run `npx playwright install chromium` once, then `npm run test:browser`. Alternatively, set `CHROME_PATH` to an existing Chrome executable. The browser test uses a simulated Supabase HTTP backend to exercise copy, clear, reply, reload, and mobile layout; it does not verify the hosted realtime service.

## Project structure

- `src/App.tsx` — clipboard UI and copy controls
- `src/clipboard.ts` — transport-independent synchronization controller
- `src/backend.ts` — Supabase reads, writes, and realtime subscription
- `supabase/setup.sql` — schema, access policies, atomic write function
- `src/style.css` / `ui-registry.md` — responsive styling and visual conventions

The initial schema enforces one row (`id = 1`). Separate clipboard paths can be introduced later by replacing that singleton ID with room identifiers and adding routing and access policies.

References: [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes), [Vite](https://vite.dev/guide/).
