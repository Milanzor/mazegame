# 🌺 Vaiana's Maze — The Heart of Te Fiti

A bright, kid-friendly top-down maze game inspired by *Vaiana* (Moana),
optimized for iPad. Drag Vaiana with one finger through four worlds — 🌊 Ocean,
🌺 Te Fiti, 🌴 Jungle and 🌋 Lava — to find the **Heart of Te Fiti** hidden deep
in each maze.

- **20 levels**, 4 worlds × 5. The map changes every 5 levels and difficulty
  ramps gently (bigger mazes, more treasures, more critters to dodge).
- **3 stars per level:** reach the Heart · collect every treasure · beat par
  time. You can never lose — stars just reward mastery.
- **Zero assets:** all art is drawn procedurally and all sound is synthesized,
  so the whole game is tiny and loads instantly.

## Develop

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build into docs/
```

## Deploy

Pushing to `main` triggers the GitHub Actions workflow
(`.github/workflows/deploy.yml`), which builds the Vite project and publishes it
to GitHub Pages. Enable it once under **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

Built with [Phaser 3](https://phaser.io/) + [Vite](https://vitejs.dev/).
