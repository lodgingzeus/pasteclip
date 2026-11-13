# Pasteclip

A live clipboard with shareable rooms. Create a room, send its link to other people, and everyone in that room can paste, copy, clear, or replace the text.

Built with React, TypeScript, Vite, and Supabase Realtime Broadcast + Presence. **No database tables or stored room records are needed.** Each room maps to its own Broadcast channel.

## Rooms

- `/` keeps the original public clipboard.
- **Create new room** generates a random UUID and opens `/room/<id>`.
- **Copy link** gives you a shareable room URL.
- **Join a room** accepts a room link from the same site or the full room code.
- Any number of people can join within your Supabase project's connection quotas. The participant count shows browsers currently present in that room.
- Different rooms have separate text and presence. Different site origins, such as preview domains and localhost, are also separate.
- A valid room link can be opened directly or refreshed. Vercel's rewrite serves the app for `/room/*` routes.
- Room links do not expire, but **text disappears when the last browser holding it leaves or reloads**. Reopening an empty room starts it fresh. Creating or joining another room leaves the current one; keep another tab open if you want its text to remain available.
- Rooms are link-accessible, not authenticated private storage. Anyone with the link can read or change the text. There are no accounts, passwords, room directory, or edit history.

## Run locally

Use Node.js 22.12+:

```sh
npm ci
npm run dev
```

The supplied Supabase project URL and publishable key are configured in `src/config/supabase.ts`. These are public browser settings, not database credentials. No database password or secret/service-role key is included or needed.

To use another project, set **both** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`; see `.env.example`. The project's Realtime settings must allow public channels. No SQL, migrations, or Postgres Changes publication is required.

## Deploy to Vercel

1. Import `lodgingzeus/pasteclip`.
2. Choose **Vite**, build command `npm run build`, output directory `dist`.
3. Deploy. The supplied public configuration is built in; environment overrides are optional. Remove outdated overrides or update both to the current project.
4. Keep `vercel.json`: it rewrites `/room/*` requests to the app, so shared links and reloads work.
5. Refresh both devices, create a room, and open its link on each device. The status becomes **Live & connected** when another browser joins.

For other static hosts, configure the same history fallback for `/room/*` to `index.html`.

## Sharing and data lifetime

- Edits are shared after a 300 ms typing pause. Copy and clear work in both directions.
- Open browsers keep text in memory. New participants receive a snapshot from a browser already in their room.
- No clipboard contents are written to a database, browser storage, or durable Broadcast history. Presence contains only an online marker.
- Supabase relays messages over secure WebSockets. No WebRTC, STUN, TURN, or direct network path between devices is required. VM NAT can remain enabled, provided the network allows HTTPS/WebSockets to Supabase.
- Messages travel over TLS, but are not end-to-end encrypted between browsers; Supabase processes the broadcasts.
- Broadcast acknowledgments confirm receipt by the service, not every participant. Browsers reconcile snapshots on joining and every 10 seconds.
- Reconnect preserves the draft. Failed sends retain text in the tab and show an error.
- Simultaneous edits resolve deterministically using logical revisions and tab IDs. This is a shared clipboard, not a document editor that merges concurrent keystrokes.
- There is no application text-length limit. Large text is split into messages and reassembled before updating the editor. Incomplete transfers expire after 60 seconds of inactivity; later snapshots can repair them. Browser memory, bandwidth, and Supabase quotas still apply.

## Project structure

```text
src/
  app/                         App routing and page composition
  components/layout/           Shared header, footer, and page shell
  config/                      Public Supabase configuration
  features/
    clipboard/
      components/              Editor and clipboard page
      hooks/                   React subscription lifecycle
      lib/                     Draft controller and snapshot reconciliation
    realtime/
      components/              Connection status and diagnostics
      lib/                     Broadcast message chunking
      services/                Supabase Broadcast and Presence adapter
      connection.ts            Connection types and messages
    rooms/
      components/              Create, join, and copy-link controls
      rooms.ts                 URL parsing, room IDs, channel naming
  styles/                      Formatted shared styles
  main.tsx                     React entry point

tests/
  unit/                        State, transport, chunk, and room tests
  e2e/                         Browser sharing and room workflows
```

## Checks and formatting

```sh
npm test
npm run build
npm run format:check
npm run format
npx playwright install chromium
npm run test:browser
```

Use `CHROME_PATH=/path/to/chrome npm run test:browser` with an existing Chrome installation. Prettier configuration is committed so future changes keep consistent indentation, spacing, and line wrapping.

Unit tests cover synchronization, retries, concurrent edits, late joins, chunking, validation, service errors, room parsing, and channel isolation. Browser tests use the real configured Supabase project on localhost channels. They cover copy, clear, large text, offline recovery, three users contributing to one room, isolation from another room, direct links/reloads, joining by link/code, invalid links, mobile overflow, and loss of text when everyone leaves. Tests consume a small amount of Realtime quota.

## Troubleshooting

Compare the full **Room link** on each device; matching domains alone is not enough for separate rooms. Open **Connection details** to check service connectivity and other-browser count. If disconnected, check network access, Supabase availability, public-channel settings, and usage limits. **Reconnect** preserves the current text.

References: [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast), [Supabase Presence](https://supabase.com/docs/guides/realtime/presence).
