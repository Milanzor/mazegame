// The 20 levels — 4 worlds × 5 levels each (see themes.js). Difficulty ramps
// smoothly *within* a world (bigger maze, more treasures, more critters, tighter
// par time) and then resets a touch as each new world opens, so every map change
// feels like a fresh, breezy start before climbing again.
//
// The maze itself is never a "fail" — you always reach the Heart eventually.
// Stars reward mastery, not luck:
//   ⭐ reach the Spirit Stone          (always earned on finishing)
//   ⭐ collect every themed treasure   (shells / flowers / berries / gems)
//   ⭐ finish under par time           (critters slow you down, so dodge them)

import { THEMES, THEMES_PER_GROUP, themeForLevel } from './themes.js';

// Maze cell grid grows step-by-step through each 5-level world.
const COLS = [6, 7, 8, 10, 11];
const ROWS = [4, 5, 6, 6, 7];

export const LEVELS = THEMES.flatMap((theme, t) =>
  theme.names.map((name, step) => {
    const cols = COLS[step];
    const rows = ROWS[step];
    const cells = cols * rows;
    return {
      name,
      themeIndex: t,
      step,
      cols,
      rows,
      // A friendly handful of treasures, scaling with the maze size.
      treasures: Math.min(3 + step + t, 9),
      // No critters for the first two levels of a world; then a gentle few.
      critters: step < 2 ? 0 : step - 1 + Math.floor(t / 2),
      // Critters drift a little faster in later worlds.
      critterSpeed: 70 + step * 10 + t * 8,
      // Generous par time: roughly enough to wander a bit and still earn the
      // speed star, scaled by maze size + treasures to collect.
      parTime: Math.round(14 + cells * 0.7 + (3 + step + t) * 2.5),
    };
  })
);

export { themeForLevel, THEMES, THEMES_PER_GROUP };
