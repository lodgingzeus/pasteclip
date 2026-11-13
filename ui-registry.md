# Pasteclip UI patterns

## Shared clipboard — 2026-11-13

Source: `src/features/clipboard/components/`, `src/styles/app.css`.

| Property                    | Pattern                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| Canvas / surface            | `#f6f7f9` / `--surface: #fff`                                             |
| Primary / secondary text    | `#262638` / `--muted: #777887`                                            |
| Accent                      | `--accent: #635bdb`; primary actions and brand                            |
| Border                      | 1px solid `--border: #e7e7ef`                                             |
| Card radius / button radius | 14px / 7px                                                                |
| Typography                  | Manrope headings and wordmark; DM Sans interface; system monospace editor |
| Card padding                | 22–25px desktop; 12–20px mobile                                           |
| Primary action              | Purple background, white text; darker purple hover                        |
| Secondary action            | Transparent; subtle tinted hover                                          |
| Focus                       | Visible lavender outline; inset editor focus ring                         |
| Status                      | Green only when realtime connected; text accompanies every status dot     |
| Shadow                      | Subtle neutral card shadow                                                |

Keep the editor as the dominant surface. Use small uppercase labels sparingly, plain language, and lightweight line icons. Preserve accessible labels and keyboard focus states. Mobile uses the same visual tokens with tighter spacing.

Broadcast sharing: the lavender notice explains service connectivity and whether another browser is present. Green means the service is subscribed and another browser is present. Errors use the existing error notice. Connection details show the clipboard origin, service state, and other-browser count; do not display WebRTC, TURN, or public-relay diagnostics. Reconnect preserves the draft. Text lives in open tabs, and the footer communicates that lifecycle.

## Room controls — 2026-11-13

Source: `src/features/rooms/components/RoomToolbar.tsx`, `src/styles/app.css`.

| Property             | Pattern                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Panel                | White surface, 1px shared border, 14px radius, 22px padding        |
| Heading              | Manrope, 18px; small purple eyebrow                                |
| Link and join inputs | Light neutral surface, 1px shared border, 7px radius               |
| Primary action       | Purple Create new room button, white text                          |
| Secondary action     | Pale lavender Copy link and Join room buttons                      |
| Input focus          | Same lavender 3px outline as other controls                        |
| Participant count    | Muted text with Users icon; no color-only status                   |
| Mobile               | Link input spans full row; actions wrap; join label on its own row |

Use the existing color tokens and notice treatment. Room URLs remain selectable and have a manual-copy fallback. Errors stay next to the join form. Full room URLs appear in diagnostics, and wording makes clear that room contents are temporary and link-accessible.
