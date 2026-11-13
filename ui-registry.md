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
