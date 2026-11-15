# React + TypeScript + Vite

`npm i && npm run dev`

## Deployments and cached app versions

Vercel uses `frontend` as the project root. `vercel.json` serves SPA routes
through `index.html`, while missing assets and file URLs return 404 instead of
HTML. HTML and service worker entry files must be revalidated (`no-cache`).

PWA updates wait until all tabs controlled by the old worker have closed. This
keeps the old HTML, JavaScript and precache together while a user is editing or
opening lazy routes. Do not enable `skipWaiting`/`clientsClaim` without a
coordinated update flow for existing tabs.

If a dynamic import fails (for example, in a tab without a service worker across
a deployment), the app reloads the current URL once per bundle and tab session.
Offline errors and repeated failures retain the route error page.
