# Pasteclip

One page, one shared clipboard. Open the same URL on both devices, leave both pages open, and paste, copy, clear, or reply.

React + TypeScript + Vite, using **Supabase Realtime Broadcast and Presence**. Browsers connect to Supabase over secure WebSockets rather than directly to one another. No WebRTC, STUN, TURN, public discovery relays, or database tables are used. VM NAT and different networks do not need a direct peer-to-peer path; the network must allow HTTPS/WebSockets to Supabase.

## Run locally

Use Node.js 22.12+:

```sh
npm ci
npm run dev
```

The supplied Supabase project URL and publishable key are configured in `src/config.ts`. These are public browser settings, not database credentials. No password or secret/service-role key is included or needed. To use another project, override **both** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`; see `.env.example`.

The Supabase project's Realtime settings must allow public channels. No SQL, table creation, migrations, or Postgres Changes publication is required.

## Deploy to Vercel

1. Import `lodgingzeus/pasteclip`.
2. Choose the **Vite** preset, build command `npm run build`, output directory `dist`.
3. Deploy. The supplied public configuration is built in; additional environment variables are optional. Remove any outdated Supabase environment overrides or update both values to the current project.
4. Refresh **both devices** after deployment; the previous WebRTC version cannot communicate with the Broadcast version.
5. Open the exact same HTTPS URL on both devices. Connection details should show **Sharing service: Connected**, and the status becomes **Live & connected** when another browser joins.

All browsers on the same origin share one clipboard. Different domains, preview URLs, and localhost use separate channels even if they share a Supabase project. Paths do not create separate clipboards.

## Behavior and data lifetime

- Changes are shared after a 300 ms typing pause; copy and clear work in both directions.
- Each tab keeps the current text in memory. A new visitor receives it from an already-open browser.
- Closing or reloading every browser holding the text loses it. Reloading one browser can recover the text while another stays connected.
- No clipboard contents are written to a database, browser storage, or durable Broadcast history. Presence contains only an online marker, not clipboard text.
- Supabase relays clipboard contents over TLS. This is not end-to-end encrypted between browsers; the service processes the messages.
- Broadcast acknowledgments confirm receipt by the service, not that every browser has received the text. Open browsers reconcile snapshots on joining and every 10 seconds.
- Reconnect preserves the local draft; browser network recovery also triggers reconnection. Failed sends show an error and retain the draft in the tab.
- Concurrent edits resolve deterministically by logical revision and tab ID. This is a clipboard, not a document editor that merges keystrokes.
- There is no application text-length limit. Large snapshots are chunked into small messages and reassembled before updating the editor. Incomplete transfers expire after 60 seconds of inactivity and can be repaired by a later snapshot. Browser memory, bandwidth, and Supabase message quotas still apply.
- This clipboard is public. Anyone who joins its channel can read, replace, or clear text. The publishable key does not make a public channel private.

## Troubleshooting

Open **Connection details** on both devices and compare URLs. If the sharing service is disconnected, check network access and the Supabase project's availability, public-channel settings, and usage limits. Use **Reconnect** without discarding text. A VM can keep its normal NAT configuration; bridged networking is no longer required by this app's transport.

If the deployed page still mentions discovery relays or TURN, it is running an older build. Wait for the new Vercel deployment and hard-refresh both browsers.

## Checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Use `CHROME_PATH=/path/to/chrome npm run test:browser` for an existing Chrome installation.

Unit tests cover synchronization, retry, concurrent edits, late joins, clearing, message chunking, malformed chunks, service errors, and state loss when everyone leaves. Browser tests use the configured real Supabase project and localhost's isolated channel, with WebRTC disabled. They verify sharing, copy, clear, replies, rejoining, large text, offline recovery, mobile layout, and a fresh empty session. A separate browser test blocks WebSockets to check error reporting and draft retention. Live tests consume a small amount of the project's Realtime quota.

## Files

- `src/App.tsx` — UI and clipboard controls
- `src/backend.ts` — Supabase Broadcast, Presence, and connection lifecycle
- `src/config.ts` — public client configuration
- `src/chunks.ts` — message splitting and reassembly
- `src/clipboard.ts` — debounced writes and draft handling
- `src/peer.ts` — in-memory snapshots and version reconciliation
- `src/connection.ts` — connection state and messages
- `src/style.css` / `ui-registry.md` — responsive styling and visual conventions

References: [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast), [Supabase Presence](https://supabase.com/docs/guides/realtime/presence).
