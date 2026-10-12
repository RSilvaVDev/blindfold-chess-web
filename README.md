# blindfold-chess-web

React client for **Blindfold Chess Coach**, a voice-first chess app for blind and low-vision players. Everything about the game runs in the browser: chess rules, the Stockfish opponent, parsing what the player said or typed, and the coach's narration. The API ([blindfold-chess-api](https://github.com/RSilvaVDev/blindfold-chess-api)) verifies sign-ins and turns the coach's lines into ElevenLabs speech.

## Structure

```
src/
  main.tsx, App.tsx    mount, AuthProvider, router (AppShell → login, ProtectedRouteGuard → play, settings)
  game-logic/          pure functions: data in, data out, no React, DOM, or network; unit tested
    parseMove.ts         text → exactly one legal move, or a reason it can't be played
    normalizeSpeech.ts   speech-recognizer text → text parseMove understands ("see four" → c4)
    narrator.ts          moves and game status → sentences meant to be read aloud
  game-session/        game state and the hooks that drive it
    gameStore.ts         GameStore: owns the chess.js instance, publishes immutable snapshots
    useChessGame.ts      reads GameStore with useSyncExternalStore
    useGameSession.ts    the only place input changes the game: parse, play, narrate, flag
    useEngineTurn.ts     asks the engine for a reply whenever it's the engine's turn
    sessionReducer.ts    the transcript (what you said, what the coach said, flags)
    useLeaveWarning.ts   beforeunload warning while a game is in progress
  engine/              the opponent
    StockfishClient.ts   UCI over a Web Worker running Stockfish (WASM)
    RandomMoveEngine.ts  fallback opponent if Stockfish can't start
    getEngine.ts         one engine per tab, with the fallback
    levels.ts            easy / medium / hard → skill level, depth, time per move
  speech/              voice in and out
    useSpeechRecognition.ts  Web Speech API push-to-talk, up to three alternatives
    AudioQueue.ts            plays lines in order: ElevenLabs via /tts, else speechSynthesis
    useSpeaker.ts            speaks each new announcement once
  auth/                supabase-js client, AuthProvider/useAuth, ProtectedRouteGuard
  api/apiClient.ts     calls the API with the access token; a 401 signs out
  config/env.ts        reads and checks VITE_ variables on first use
  components/          BoardView, MoveInput, PushToTalkButton, Transcript, AnnouncementRegion, …
  pages/               LoginPage, PlayPage, SettingsPage
scripts/copy-engine.mjs  copies the Stockfish build from node_modules into public/engine/
```

## How a move flows

1. The player types "bishop on c4 to d5" in `MoveInput`, or presses **Speak a move** and `useSpeechRecognition` returns up to three transcripts.
2. `useGameSession` checks it is the player's turn and the game is active, then runs each candidate through `normalizeSpeech` (spoken input only) and `parseMove`.
3. `parseMove` matches the words against chess.js's legal moves: the piece, the from-square, the to-square, a capture, a promotion piece. One match is the move. No match or several matches return a reason instead ("There's no piece on c4.", "Two knights can reach d2, on b1 and f3…").
4. `GameStore` plays the move and publishes a new snapshot; components re-render from it.
5. `narrator` turns the move into a sentence, which goes into the transcript and becomes the newest announcement.
6. `useEngineTurn` sees it is the engine's turn, asks `getEngine()` for a move for that position, plays it, and narrates it. A reply for a position that has since changed (for example, a new game started mid-search) is dropped.
7. `AnnouncementRegion` puts each announcement in an `aria-live` region for screen readers, and `useSpeaker` sends it to `AudioQueue`, which fetches ElevenLabs audio from `POST /tts` (4 second budget) and falls back to the browser voice.

## Design decisions

- **Pure core.** Everything that decides what an input means or what the coach says lives in `src/game-logic/` as pure functions, so it is unit tested and independent of React and the browser.
- **One owner of game state.** chess.js is mutable, so `GameStore` keeps it outside React and publishes snapshots read with `useSyncExternalStore`; no component reads mutable state during render. `useGameSession` is the only code that changes the game in response to input.
- **Nothing is guessed.** An ambiguous or impossible move always gets a spoken and visible reason and never changes the game.
- **Speech never blocks.** Speech output degrades to `speechSynthesis`; speech input is optional next to the typed field.
- **Accessible by default.** Every announcement reaches an `aria-live` region; the transcript is not a live region, so nothing is read twice. `BoardView` is `aria-hidden`; everything works by keyboard; every page has a skip link.

## Chess engine

The opponent is [Stockfish](https://stockfishchess.org/) via [Stockfish.js](https://github.com/nmrugg/stockfish.js) (the `stockfish` npm package, pinned), using the lite single-threaded WebAssembly build (about 1.8 MB). The multi-threaded builds need cross-origin isolation headers and the full builds are about 99 MB, so neither fits a static host. `pnpm dev` and `pnpm build` run `scripts/copy-engine.mjs`, which copies the engine into `public/engine/` (git-ignored). The prebuilt `stockfish.js` is itself the Web Worker and loads `stockfish.wasm` from the same folder.

Stockfish is licensed under the GNU GPL v3; its license is served next to the engine at `/engine/COPYING.txt`, and its source is at https://github.com/official-stockfish/Stockfish.

## Configuration

| Variable                        | Purpose                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `VITE_API_URL`                  | Base URL of blindfold-chess-api                                                        |
| `VITE_SUPABASE_URL`             | Supabase project URL                                                                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`); `config/env.ts` rejects anything else |

All three are required. `VITE_` values are baked into the bundle at build time and are public, so only public values belong here; changing one needs a rebuild.

## Prerequisites

### Tools

- **Git**, to clone the repo.
- **Node.js 22 or newer** (`engines` in `package.json`).
- **pnpm 11.28.5**, the version pinned in `packageManager`. Run `corepack enable` once and Node installs it for you.

### Services

- **[blindfold-chess-api](https://github.com/RSilvaVDev/blindfold-chess-api#run-locally) running locally** on `http://localhost:3000`, with `CORS_ORIGIN=http://localhost:5173`. Set it up first; its prerequisites cover the Supabase project and the ElevenLabs key.
- **The same Supabase project** the API uses, with two values from **Connect → Server**:
  - **Project URL** (`SUPABASE_URL`).
  - **Publishable key** (`SUPABASE_PUBLISHABLE_KEY`, starts with `sb_publishable_`). Never the secret key.

### Browser and hardware

- **Any modern browser** for playing by typing.
- **Chrome or Edge** for voice input; Firefox and Safari don't support the Web Speech recognition API.
- **A microphone** for voice input, and **speakers or headphones** to hear the coach. Headphones stop the mic from picking up the coach's voice.

## Run locally

### 1. Install

```
git clone https://github.com/RSilvaVDev/blindfold-chess-web.git
cd blindfold-chess-web
pnpm install
cp .env.example .env
```

### 2. Fill in `.env`

| Variable                        | Where to find it                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `VITE_API_URL`                  | `http://localhost:3000`                                                                                      |
| `VITE_SUPABASE_URL`             | Supabase → **Connect** → **Server**: `SUPABASE_URL`                                                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Connect** → **Server**: `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`), never the secret key |

### 3. Start

```
pnpm dev    # copies the Stockfish engine into public/engine/, then serves http://localhost:5173
```

### 4. Play

1. Open http://localhost:5173 and create an account (use any email; with email confirmation off you are signed in straight away).
2. Choose a color and a level, then **Start game**.
3. Type `pawn to e4` and press **Play**, or press **Speak a move** and say it. The coach announces your move and Stockfish's reply out loud.

If the page says "Can't reach the server", the API isn't running or `VITE_API_URL` is wrong. If you hear a robotic voice instead of the ElevenLabs one, the API's `/tts` call failed and the browser voice took over; check the API's terminal.

To run the unit tests: `pnpm test`.

## Scripts

| Script              | Does                                                        |
| ------------------- | ----------------------------------------------------------- |
| `pnpm dev`          | copies the engine, starts Vite                              |
| `pnpm build`        | copies the engine, type-checks, builds to `dist/`           |
| `pnpm test`         | Vitest: the `game-logic` unit tests                         |
| `pnpm format:check` | Prettier                                                    |
| `pnpm lint`         | ESLint: type-aware typescript-eslint plus React hooks rules |
| `pnpm typecheck`    | `tsc -b --noEmit`                                           |

GitHub Actions runs format, lint, typecheck, build, and tests on every push and pull request.

## Deployment

One Railway service. Railpack detects the Vite app, runs `pnpm build`, and serves `dist/` with Caddy; there is deliberately no start command, because one would turn static serving off. Set the three `VITE_` variables before the build, and set the API's `CORS_ORIGIN` to this service's URL.
