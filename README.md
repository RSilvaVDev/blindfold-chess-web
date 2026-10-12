# blindfold-chess-web

React client for Blindfold Chess Coach, a voice-first chess app for blind and low-vision players.

Work in progress. The full README (what works, what is incomplete, how to run both repos) lands at the end.

## Run locally

```
pnpm install
cp .env.example .env
pnpm dev
```

## Environment

| Variable                        | Required | Purpose                                                                                                                                  |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`                  | yes      | Base URL of `blindfold-chess-api`, for example its Railway URL                                                                           |
| `VITE_SUPABASE_URL`             | yes      | Supabase project URL, `https://<project-ref>.supabase.co`                                                                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes      | Supabase publishable key (`sb_publishable_...`). The app refuses to start with anything else, so a secret key can't end up in the bundle |

`VITE_` variables are baked into the JavaScript bundle when `vite build` runs, and anyone can read them in the browser. Only public values go here. Changing one needs a rebuild (on Railway, a redeploy).

## Deploy (Railway)

1. Create a Railway service from this GitHub repo. It redeploys on every push to `main`.
2. Set `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` before the first build. Leave `PORT` unset.
3. Railway's Railpack builder detects the Vite app, runs `pnpm build`, and serves `dist/` as a static site with Caddy. Do not set a start command: that turns static serving off. If it ever picks the wrong folder, set `RAILPACK_SPA_OUTPUT_DIR=dist`.
4. Set the API's `CORS_ORIGIN` to this service's URL.
