# Pasteclip

One page, one shared clipboard. Open the same URL on both devices, leave both pages open, and paste, copy, clear, or reply. No database, accounts, API keys, or environment variables are required.

React + TypeScript + Vite, with [Trystero](https://github.com/dmotz/trystero) connecting browsers through WebRTC. Public Nostr relays exchange connection information; clipboard text travels over peer data channels and lives only in browser memory.

## Run locally

Use Node.js 22.12+:

```sh
npm ci
npm run dev
```

For cross-device testing, deploy to HTTPS and open the **same URL** on each device. WebRTC discovery uses Web Crypto, which requires a secure context; plain HTTP on a LAN IP is not sufficient. Localhost works for testing browsers on one computer.

## Deploy to Vercel

1. Import `lodgingzeus/pasteclip`.
2. Choose the **Vite** preset, build command `npm run build`, and output directory `dist`.
3. Deploy. No database setup or environment variables are needed.
4. Open the exact same deployed URL on both devices and wait for **Peer connected**.
5. Paste on one device, copy on the other, then clear and reply.

Old Supabase environment variables can be removed; the app no longer reads them. It does not touch or delete any previously created Supabase data.

## How it behaves

- Text is sent after a 300 ms typing pause. Copy and clear work in both directions.
- A new visitor receives the current clipboard from an already connected browser.
- Text disappears once all pages holding it close or reload. Reloading one page can recover it if another remains connected.
- With no peer connected, you can type locally. The status says **Waiting for another device**, and your text is shared when another browser connects.
- Changes are versioned with a logical counter and a per-tab ID. Concurrent changes resolve deterministically; this does not merge simultaneous typing like a collaborative document editor.
- Peers exchange snapshots on joining and every 10 seconds to reconcile missed updates.
- Clipboard contents are not written to local storage, cookies, a database, or a server. Identity keys are ephemeral too.
- There is no application text-length limit. The library chunks messages; browser memory and bandwidth still impose practical limits.
- Every page on the same origin joins one public clipboard. Preview domains, custom domains, and localhost are separate clipboards even if they host the same build. Paths are not separate rooms.
- Anyone on that origin can read or replace the clipboard. It is not private storage.

## Connection limits

This is a lightweight, best-effort peer-to-peer app. Public discovery relays and STUN servers are external dependencies even though you do not need to provision a backend. Public relay outages, blocked WebSockets, restrictive NAT/firewalls, or browser suspension can prevent devices from connecting. Keep both pages active. If it remains waiting, try a different network.

No TURN relay is configured. Supporting restrictive networks reliably would require adding a TURN service or moving to a managed realtime messaging service. A **Peer connected** status means a peer data channel exists, not that every edit has been acknowledged by every device.

## Checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`CHROME_PATH=/path/to/chrome npm run test:browser` uses an existing Chrome installation.

Unit tests cover updates, retry behavior, large text, late joins, clearing, simultaneous edit convergence, invalid messages, and losing state after everyone leaves. The browser test uses real public discovery relays and WebRTC between separate browser contexts, so it needs internet access; it covers late join, copy, clear, replies, rejoining, large text, mobile overflow, and a fresh empty session.

## Files

- `src/App.tsx` — UI and copy controls
- `src/clipboard.ts` — debounced writes and draft handling
- `src/peer.ts` — in-memory snapshots and version reconciliation
- `src/backend.ts` — WebRTC discovery and peer channel adapter
- `src/style.css` / `ui-registry.md` — responsive styling and visual conventions
