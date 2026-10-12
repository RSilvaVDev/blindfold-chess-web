# blindfold-chess-web

React client for Blindfold Chess Coach, a voice-first chess app for blind and low-vision players, and for sighted players practicing without a board. The player speaks or types a move, Stockfish replies out loud, and the player can ask about the position at any time. Rules, the opponent, the move parser, and speech all run in the browser. The API (`blindfold-chess-api`, a separate repo) handles settings and text-to-speech.

## Scope

In: sign-up/login, per-user settings (voice, verbosity, confirmations), a full game vs Stockfish at 3 levels, spoken or typed moves, disambiguation and promotion questions, board queries (board, file, rank, piece location, last move, repeat), take back, resign, flagging every illegal move or unsupported request with a reason.

Out (do not build unless asked): saving/resuming games, game history, hints, speech rate, voice cloning, multiplayer, opening trainer, analysis, spatial audio, mobile wrapper.

## Stack

React, TypeScript (strict), Vite, React Router, vitest, chess.js, Stockfish (WASM in a Web Worker), Web Speech API (voice in), ElevenLabs via the API with `speechSynthesis` fallback (voice out), `supabase-js` (auth). Deployed as one Railway static service (Railpack serves `dist/` with Caddy).

## Layout

```
src/
  game-logic/     The app's rules as pure functions: turn what the player said into a move,
                  a command, or a question back; explain why an input is illegal; write what
                  the app says. No React, browser APIs, or network. Every file has tests.
                  types, homophones, normalize, tokenize, resolve, answers, flags, commands,
                  narrator, README.md
  game-session/   Game state and the hooks that call game-logic: GameStore (owns the
                  chess.js instance), useChessGame, useGameSession, sessionReducer,
                  useLeaveWarning
  engine/         StockfishClient, stockfish.worker.ts, levels.ts
  speech/         useSpeaker, AudioQueue, useSpeechRecognition
  auth/           supabaseClient, AuthProvider, useAuth, ProtectedRouteGuard
  settings/       SettingsProvider, useSettings
  api/            apiClient
  config/         env.ts: reads and checks VITE_ variables on first use
  components/     AppShell, AnnouncementRegion, BoardView, NewGameForm, GameStatusBar,
                  MoveInput, Transcript, PromptChoices, PushToTalkButton
  pages/          LoginPage, PlayPage, SettingsPage
.github/workflows/ci.yml
```

## Contract with the API

- Sign in with Supabase and send `Authorization: Bearer <access token>` on every call except `/health`. `apiClient` adds it and handles 401 by announcing the expired session and returning to login.
- `GET /me`, `GET /profile`, `PUT /profile` (`voiceId`, `verbosity`, `confirmMoves`), `POST /tts` (`text`, optional `voiceId`; returns an audio URL).
- Verbosity values are `brief`, `standard`, `full`. There is no shared package: when a shared type changes, change it in both repos, one commit each.
- `VITE_API_URL` is the API's Railway URL.

## Commands

```
pnpm install
pnpm dev                # vite
pnpm format             # prettier --write .
pnpm format:check       # prettier --check .
pnpm lint               # eslint . (typescript-eslint type-aware + react-hooks)
pnpm typecheck          # tsc -b --noEmit
pnpm build              # vite build
pnpm test               # vitest run (src/game-logic)
```

## Conventions

- Components and pages are PascalCase files; hooks start with `use`.
- Guards end in `Guard`: `ProtectedRouteGuard`.
- `src/game-logic/` holds only pure functions: data in, data out. Nothing there imports React, touches the DOM, calls `fetch`, or uses Web Speech or audio. Every new rule there gets a unit test.
- `useGameSession` is the only place that changes game state in response to input. Components send input to it and render its state.
- Mutable objects (the chess.js instance) live in a store outside React (`GameStore`) that publishes immutable snapshots; hooks read them with `useSyncExternalStore`. Never read a ref during render; the react-hooks lint rules enforce this.
- Callback types are function properties (`onStart: (s: GameSettings) => void`), not method shorthand, so `@typescript-eslint/unbound-method` stays quiet for real reasons.
- TypeScript strict. No `any`; narrow unknown input instead.
- Comments are short and state the technical reason. No references to tickets, specs, or people.
- Prettier settings match the API repo.

## Rules that must hold

- Every message the app speaks also appears as text in the `aria-live` region (`AnnouncementRegion`). Everything works by keyboard, every control has a label, and focus never traps. `BoardView` is `aria-hidden`.
- An illegal or unrecognized input never changes game state and never counts as a turn. It always gets a spoken and visible reason from `flags`.
- Never guess a move. Several matches ask "Which knight?"; a promotion with no piece named asks which piece.
- Speech never blocks the game: if `/tts` fails or is slow, `useSpeaker` falls back to `speechSynthesis`.
- Voice input is optional. The typed `MoveInput` always works, and an unsupported browser or denied mic switches to it with a spoken reason.
- The client never calls ElevenLabs directly and never holds a secret key.
- Never commit secrets. `.gitignore` covers `.env`, `.env.*` (except `.env.example`), `*.local`, `node_modules`, `dist`, `coverage`, `*.tsbuildinfo`, and logs. The Vite template's default ignore file does not cover `.env`; keep that line. Check `git status` for env files before every commit.

## Workflow

- Work follows the build plan's commit order, one commit per plan entry, using the plan's commit message.
- Every commit leaves the repo formatting cleanly, type-checking, building, and deployable. Before proposing a commit, run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and (once tests exist) `pnpm test`. Fix lint errors instead of disabling rules; if a rule is pure noise, turn it off in `eslint.config.mjs` with a one-line reason. CI (`.github/workflows/ci.yml`) runs the same on every push and pull request.
- A change that also needs the API is two commits, one per repo.
- This repo's README is the main submission README. It links the API repo and both deployed URLs.

## Environment

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`), `VITE_API_URL`. Use Supabase's new publishable key, never the legacy anon key; `getEnv()` rejects anything that isn't `sb_publishable_...`.

Listed with placeholder values in `.env.example`. `VITE_` variables are bundled into the public build, so only public values go here: never the Supabase secret key or the ElevenLabs key. Read and check env at runtime, not at build time, so CI builds without secrets.

## Known gotchas

- Load the Stockfish worker with `new Worker(new URL('./stockfish.worker.ts', import.meta.url), { type: 'module' })`, or serve the prebuilt engine from `public/`. If setup stalls, fall back to a random legal move so the game loop still works.
- Confirm the installed chess.js has `attackers(square, color)`; the "leaves your king in check" reason depends on it. Pawn pushes need their own check.
- Web Speech recognition works in Chrome and Edge only.
- The engine moves first when the player picks Black.
- Audio playback needs a prior user gesture; the first spoken line follows the Start game click.
- Railway's Railpack builder detects the Vite app and serves `dist/` with Caddy. Never add a start command or `start` script for production: either one turns static serving off. `RAILPACK_SPA_OUTPUT_DIR=dist` forces the folder if detection ever misfires.
