# Pasteclip UI patterns

## Shared clipboard — 2026-11-13

Source: `src/App.tsx`, `src/style.css`.

| Property | Pattern |
| --- | --- |
| Canvas / surface | `#f6f7f9` / `--surface: #fff` |
| Primary / secondary text | `#262638` / `--muted: #777887` |
| Accent | `--accent: #635bdb`; primary actions and brand |
| Border | 1px solid `--border: #e7e7ef` |
| Card radius / button radius | 14px / 7px |
| Typography | Manrope headings and wordmark; DM Sans interface; system monospace editor |
| Card padding | 22–25px desktop; 12–20px mobile |
| Primary action | Purple background, white text; darker purple hover |
| Secondary action | Transparent; subtle tinted hover |
| Focus | Visible lavender outline; inset editor focus ring |
| Status | Green only when realtime connected; text accompanies every status dot |
| Shadow | Subtle neutral card shadow |

Keep the editor as the dominant surface. Use small uppercase labels sparingly, plain language, and lightweight line icons. Preserve accessible labels and keyboard focus states. Mobile uses the same visual tokens with tighter spacing.

Peer-sharing update: the existing notice style explains that both pages must remain open. Green status now means an actual peer data channel is connected; waiting has neutral styling. No database setup messages remain in the interface.

Connection diagnostics: reuse the lavender notice for discovery status and the existing error notice for reported connection failures. Keep technical counts and the clipboard origin in a collapsed, keyboard-accessible details element. Retry uses the existing notice button treatment and preserves text.

Relay health: label socket counts literally as “Discovery sockets open.” Display recent rejection counts separately and show the error notice for observed rate-limit or rejection messages; do not imply that an open socket guarantees successful discovery.
