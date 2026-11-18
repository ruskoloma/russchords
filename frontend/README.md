# russchords — frontend

React 19 + TypeScript + Vite, Mantine 8 UI, TanStack Query for server state,
`oidc-client-ts` (Cognito) for auth.

```sh
npm i
npm run dev          # needs a .env (see make_env.py) — or `npm run dev -- --mode test` with mocks
npm run test         # unit tests (Vitest)
npm run test:e2e     # browser tests (Playwright, everything mocked)
npm run build
```

## Layout

```
src/
  app/         router, query client (+ offline cache), PWA update prompt
  auth/        user manager, session renewal, sign-in/out, useSession()
  api/         fetch client + one module per resource (queries & mutations)
  components/  app shell (sidebar / bottom tabs) and shared UI
  features/    song (viewer, editor, list), playlist, playmode
  pages/       one file per route (lazy-loaded)
  lib/         storage, text, navigation and notification helpers
```

## Data

- All server data goes through TanStack Query. Route loaders only *prefetch*
  (in parallel with the page chunk); pages render instantly from cache or with
  a skeleton and revalidate in the background (also on window focus).
- Every mutation updates or invalidates the affected queries, so a saved song
  or playlist is shown immediately everywhere. Playlist saves diff against a
  fresh server copy, never against what the page loaded earlier.
- The query cache is persisted to IndexedDB per user (`app/queryClient.ts`)
  so the app opens instantly and keeps working on a weak connection. It is
  dropped on sign-out or when another user signs in.
- The service worker does **not** cache API responses (it used to, which
  showed stale songs after editing and mixed users' data).

## Sessions

`auth/session.ts` owns token renewal:

- ID tokens are renewed with the refresh token only — no hidden iframe
  (Cognito doesn't support `prompt=none`).
- Renewal is single-flight per tab and serialized across tabs (Web Locks).
- Timers, tab-visible and back-online events all trigger a check, so a phone
  waking up renews the token before the first request.
- Network errors and Cognito 5xx keep the session; only an OAuth rejection
  (`invalid_grant`, …) ends it — with a "Session expired → Sign in" notice,
  never an automatic redirect.
- Sign-in / sign-out / renewals are mirrored between tabs.
- The song editor auto-saves a local draft, so nothing is lost if the session
  expires mid-edit or the tab is closed.

## Deployments and cached app versions

Vercel uses `frontend` as the project root. `vercel.json` serves SPA routes
through `index.html`, while missing assets and file URLs return 404 instead of
HTML. HTML and service worker entry files must be revalidated (`no-cache`).

A new service worker waits instead of taking over open tabs (so they never
lose the lazy chunks they still need). The app checks for updates hourly and
when it becomes visible, and shows an **Update available → Reload** prompt
(`app/UpdatePrompt.tsx`). Do not enable `skipWaiting`/`clientsClaim`.

If a dynamic import fails (for example, in a tab without a service worker across
a deployment), the app reloads the current URL once per bundle and tab session.
Offline errors and repeated failures retain the route error page.
