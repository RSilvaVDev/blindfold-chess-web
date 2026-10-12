# Blindfold Chess Coach

A voice-first chess app for blind and low-vision players, and for sighted players who want to practice playing without a board. You play Stockfish by speaking or typing moves in plain words ("bishop on c4 to d5"); the coach speaks every move, reply, and mistake out loud, and the same messages appear on screen and in a screen-reader live region.

Chess is the passion, voice is the interface, and the hard part is making a spoken game trustworthy: the app never guesses a move and never silently ignores input.

- **Live app:** `<WEB_RAILWAY_URL>`
- **API:** `<API_RAILWAY_URL>`, source at [blindfold-chess-api](https://github.com/RSilvaVDev/blindfold-chess-api)
- This repo is the React client. The API repo handles sign-in checks and text-to-speech.

## What works

- **Accounts:** sign up and sign in with email and password (Supabase Auth). Protected pages redirect to sign-in and back; an expired session signs you out and says why on the sign-in page.
- **A full game against Stockfish** (WebAssembly, in a Web Worker) at easy, medium, or hard, as White or Black. As Black, the engine moves first. A "thinking" notice appears if it takes over two seconds. If Stockfish can't load, a random-move opponent keeps the game playable.
- **Moves in plain words or notation:** "bishop on c4 to d5", "c4 to d5", "knight to f3", "pawn takes d5", "castle kingside", "e7 to e8 queen", or `e4`, `Nf3`, `O-O`. When a move can't be played the coach says why ("There's no bishop on c4.", "The bishop on c4 can't move to c5.") and asks which piece when two can reach the square.
- **Voice input:** press **Speak a move** and say it (Chrome or Edge, Web Speech API). Common mishearings are corrected ("see four" is c4, "night" is knight), and the app tries the recognizer's alternatives and plays the first one that is a legal move. What it heard is shown in the transcript. Typing always works too, and a blocked or missing microphone is explained out loud.
- **Spoken narration** in plain words: "Black plays knight takes pawn on e4, check." Audio comes from ElevenLabs through the API, queued so lines never overlap, with the browser's own voice as a fallback so speech never blocks the game.
- **Every input gets a response.** Moves during the engine's turn, after the game ends, illegal moves, and empty input are all flagged with a spoken and visible reason; none of them change the game.
- **Accessibility:** every spoken message also goes to an `aria-live` region, everything works by keyboard, there is a skip link, and the visual board is hidden from screen readers. A transcript shows the whole conversation.
- **Game end:** checkmate, stalemate, threefold repetition, insufficient material, and the fifty-move rule are detected and announced. The browser warns before you leave a game in progress.
- **Visual board** for sighted players and demos: equal squares at any screen size, flipped when you play Black, last move highlighted.

## What is incomplete

- **Voice input outside Chrome and Edge** (Firefox and Safari lack the Web Speech recognition API), and spoken answers to the coach's questions ("the one on b1"); today you repeat the move with its square.
- **Check-specific reasons** ("that would leave your king in check"); today those moves get "can't move to".
- **Board queries:** "read the board", "what's on the e file", "where is my queen".
- **Take back and resign** by command, **settings** (voice, verbosity, confirmations), and saved games.
- More unit tests (the move parser has them), and a Supabase Storage cache for speech audio that survives API restarts.

## Run both repos locally

Requires Node 22+, pnpm, a Supabase project (email confirmation turned off), and an ElevenLabs API key.

1. **API** ([blindfold-chess-api](https://github.com/RSilvaVDev/blindfold-chess-api)):
   ```
   pnpm install
   cp .env.example .env          # Supabase URL and database string, ElevenLabs key; CORS_ORIGIN=http://localhost:5173
   pnpm prisma migrate deploy
   pnpm dev                      # http://localhost:3000
   ```
2. **Web** (this repo):
   ```
   pnpm install
   cp .env.example .env          # VITE_API_URL=http://localhost:3000, Supabase URL and publishable key
   pnpm dev                      # http://localhost:5173
   ```
3. Open http://localhost:5173, create an account, start a game, and type `e4`.

## Environment

| Variable                        | Required | Purpose                                                                                                          |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`                  | yes      | Base URL of `blindfold-chess-api`                                                                                |
| `VITE_SUPABASE_URL`             | yes      | Supabase project URL, `https://<project-ref>.supabase.co`                                                        |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes      | Supabase publishable key (`sb_publishable_...`). The app refuses anything else, so a secret key can't be bundled |

`VITE_` values are baked into the JavaScript bundle at build time and are public. Changing one needs a rebuild.

## How it is built

- **React, TypeScript (strict), Vite, React Router**, with chess.js for rules.
- `src/game-logic/`: pure functions, such as the narrator that turns moves into sentences.
- `src/game-session/`: `GameStore` owns the chess.js instance and publishes immutable snapshots (read with `useSyncExternalStore`); `useGameSession` is the only place that changes game state in response to input.
- `src/engine/`: a `ChessEngine` interface with `StockfishClient` (UCI over a Web Worker) and a random-move fallback.
- `src/speech/`: `AudioQueue` plays ElevenLabs audio in order, falling back to `speechSynthesis`.
- **Quality:** Prettier, ESLint (type-aware typescript-eslint plus React hooks rules), `tsc`, and the build run in GitHub Actions on every push and pull request.

## Chess engine and license

The opponent is [Stockfish](https://stockfishchess.org/), via [Stockfish.js](https://github.com/nmrugg/stockfish.js) (lite, single-threaded WebAssembly build, about 1.8 MB). `pnpm dev` and `pnpm build` copy it from `node_modules` into `public/engine/`. Easy, medium, and hard set Stockfish's skill level, search depth, and time per move (`src/engine/levels.ts`).

Stockfish is licensed under the GNU GPL v3; its license is served next to the engine at `/engine/COPYING.txt`, and its source is at https://github.com/official-stockfish/Stockfish.

## Deploy (Railway)

1. Create a Railway service from this repo. It redeploys on every push to `main`.
2. Set the three `VITE_` variables before the first build. Leave `PORT` unset.
3. Railway's Railpack builder detects the Vite app, runs `pnpm build`, and serves `dist/` with Caddy. Do not set a start command: that turns static serving off.
4. Set the API's `CORS_ORIGIN` to this service's URL.
