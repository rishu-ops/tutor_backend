---
name: frontend
description: Conventions and known issues for apps/web (Next.js 16 + Tailwind v4) in project-tutor. Use for any UI/UX work — new pages, component changes, styling fixes, or accessibility/responsive passes on the web app.
---

# project-tutor frontend

`apps/web` is Next.js **16** with Turbopack and Tailwind **v4** (`@import "tailwindcss"` + `@theme inline`, not a `tailwind.config.js`). Read `apps/web/AGENTS.md` before touching anything — this Next.js version has real breaking changes from training-data assumptions; check `node_modules/next/dist/docs/` when unsure about an API.

## The actual design system

Tokens live in `apps/web/src/app/globals.css` under `:root` and are re-exposed via `@theme inline` for Tailwind utilities. This is the real, current theme — treat it as source of truth over anything you find hardcoded elsewhere:

| Token                                                                   | Value                             | Use                                                           |
| ----------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| `--color-primary`                                                       | `#00A453`                         | Brand green — primary actions, links, active states           |
| `--color-dark-neutral`                                                  | `#00060c`                         | Near-black — headings, dark surfaces                          |
| `--color-charcoal`                                                      | `#2d2d2d`                         | Form labels, headers                                          |
| `--color-text-secondary`                                                | `#384148`                         | Body/secondary text                                           |
| `--color-text-muted`                                                    | `#647380`                         | Meta text, timestamps                                         |
| `--color-border`                                                        | `#dadee2`                         | Default border                                                |
| `--color-success` / `warning` / `error`                                 | `#16a34a` / `#f59e0b` / `#dc2626` | Status colors                                                 |
| `--radius-btn` / `--radius-input` / `--radius-card` / `--radius-dialog` | `8px` / `12px` / `8px` / `12px`   | Match the surface to its radius token, don't invent new radii |

Typography: `h1`–`h4`, `p`, `label`, `small` all have base styles in `globals.css` — prefer semantic tags over re-declaring font-size utilities. Font is Geist Sans (`--font-sans`).

**There are two visual languages in this codebase, and that split looks unintentional, not a deliberate marketing-vs-app choice:**

- Most of the actual app (dashboard, messages, bookings, contracts, admin) uses a clean modern style: white surfaces, soft shadows (`shadow-sm`/`shadow-xs`), `rounded-xl`/`rounded-2xl`, `#00A453` green accents, built mostly with raw Tailwind classes rather than the shared `Button` component.
- `components/ui/button.tsx`'s **default** variants (`primary`/`secondary`/`dark`/`ghost`/`danger`) are a different, older neo-brutalist style — hard `shadow-[3px_3px_0px_#00060c]` offsets, black borders, translate-on-hover/active. These are still the _default_ (`variant` defaults to `'primary'`), so any `<Button>` used without an explicit variant renders in this clashing style. It's used across marketing pages (navbar, hero, about/help/privacy) and a few dashboard pages inconsistently mixed with modern-styled siblings.
- `primary-modern`/`secondary-modern`/`dark-modern` variants exist and actually match the `globals.css` tokens, but are used in only one file today.
- The focus ring on every `Button` variant is `ring-[#004fcb]` (labeled "Indeed Blue" in globals.css) — that color doesn't appear anywhere else in the live theme. Treat any blue you find as a leftover, not intentional.

When asked to fix inconsistency here, default to the _modern_ language (it matches the documented tokens and is what the actual app already mostly uses) — don't invent a third style.

## Component conventions

- `cn()` from `@/lib/utils` for conditional classnames (clsx + tailwind-merge pattern) — use it, don't string-concatenate classes.
- Modals are hand-rolled per-component (`fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50`), not a shared `<Dialog>` — match this pattern rather than introducing a new modal primitive.
- Most pages fetch with raw `fetch()` to relative `/api/...` paths (works via the `next.config.ts` rewrite to the API) rather than the shared `api()` helper in `lib/api.ts` — this is a known inconsistency (tracked as improvement I15 in the audit), not something to silently "fix" as a side effect of unrelated UI work.
- Auth: `useAuthStore`/`useAdminAuthStore` (zustand). The access token lives in memory only (not persisted) — a page that needs it should read `accessToken` reactively from the store, not cache it in local state, since it's repopulated asynchronously by a silent refresh on mount.

## Before calling UI work done

1. Start both dev servers and actually look at the page: `pnpm --filter api dev` and `pnpm --filter web dev` (ports 3000/3001). A visual/interactive check catches things a diff review won't — flex/grid math, real overflow, actual contrast.
2. Check at least one mobile viewport width — several existing components (e.g. the marketing navbar) hide content at `md:` with no mobile alternative provided, which is easy to miss just reading the JSX.
3. Run `pnpm --filter web exec tsc --noEmit` — this codebase has caught real bugs this way before.
4. If you don't have browser automation available, say so explicitly rather than claiming a visual fix was confirmed working — verify via server logs, curl, and careful code reading of the actual rendered classes instead, and note what still needs a human's visual pass.
