# 🌺 Vaiana's Maze — The Heart of Te Fiti

A top-down maze game for little kids, inspired by *Vaiana* (Moana). Drag Vaiana
with one finger through ocean, Te Fiti, jungle and lava mazes to find the Heart
of Te Fiti. Collect themed treasures and beat par time for stars. Bright,
storybook-cartoon art — nothing scary, and you can never "lose": you always
reach the Heart, stars just reward mastery.

## Workflow (IMPORTANT)

- Source: `index.html` (root) + `src/*.js`. Vite builds to `docs/`
  (`base: './'`, hashed bundles). `docs/` is **gitignored** — it is NOT
  committed; GitHub Actions rebuilds it on every push.
- **edit → `git add -A` → commit → push to `origin/main`.** The
  `.github/workflows/deploy.yml` Action runs `npm ci && npm run build` and
  publishes `docs/` to GitHub Pages. Push without asking — deploying is part of
  "done".
- `npm run dev` — local dev server with HMR. `npm run build` — produce `docs/`.

## Build / stack

- Phaser 3 + Vite. Zero image/audio files: every sprite is drawn procedurally
  (`textures.js`) and every sound is synthesized via Web Audio (`sounds.js`).
- HiDPI: textures bake at `RENDER_SCALE` and scenes counter-scale (`hiRes()`),
  so the 1280×720 logical layout stays pixel-identical but sharp on retina
  iPads. Display scales are written as `setScale(factor / RENDER_SCALE)`.

## Code map

- `src/main.js` — Phaser config, `RENDER_SCALE`, iPad touch polish, update check.
- `src/themes.js` — the 4 worlds (palettes, treasure/critter/particle/deco keys,
  level names). `themeForLevel(i)` and `THEMES_PER_GROUP` (map changes every 5).
- `src/levels.js` — generates the 20 levels (4 worlds × 5), with the difficulty
  curve (maze size, treasures, critters, par time).
- `src/maze.js` — recursive-backtracker maze on a `(cols*2+1)×(rows*2+1)` wall
  grid, BFS helpers (`farthestCell` = where the Heart hides), `shuffledCells`.
- `src/util.js` — seeded RNG (`makeRng`, per-level so mazes are stable), `pick`,
  `mix`.
- `src/textures.js` — all procedural art (Vaiana, the Heart, per-world
  treasures/critters/particles/decorations, walls drawn in-scene, UI).
- `src/background.js` — themed gradient + drifting particles, pill/round buttons,
  mute toggle, `hiRes`, tap helpers (`enableContainerTap` uses a child Zone so
  taps land correctly inside nested containers).
- `src/sounds.js`, `src/storage.js`, `src/update-check.js` — audio, localStorage
  progress (best stars per level), and the ✨-update poller.
- `src/scenes/` — `Boot` (bake textures) → `Menu` → `LevelSelect` (themed cards,
  3 pages) → `Game` (the maze).

## Gameplay notes

- One-finger drag steers Vaiana; arcade physics collides her with merged
  horizontal wall runs (`buildColliders`). She can never clip through.
- 3 stars: reach the Heart (always) · collect every treasure · finish under par.
- Critters patrol corridors tile-by-tile (`pickNextTile`); bumping one is a
  gentle ~0.5s freeze + flash (costs time, never a game-over).
- Worlds (every 5 levels): 🌊 Ocean → 🌺 Te Fiti → 🌴 Jungle → 🌋 Lava. Keep all
  art and copy friendly and non-scary.
