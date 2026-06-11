// Maze generation + navigation helpers.
//
// The maze is stored on a "wall grid" of size (cols*2+1) × (rows*2+1):
//   - odd/odd coordinates are CELLS (the rooms you walk in),
//   - even coordinates between them are the WALLS that may be carved away.
// A perfect maze (exactly one path between any two cells) is carved with a
// recursive-backtracker, so every level is guaranteed solvable. Seeding the rng
// per level keeps each maze fixed across replays.

// Carve a perfect maze. Returns { gw, gh, walls, cols, rows } where
// walls[y][x] === true means "solid wall tile".
export function generateMaze(cols, rows, rng) {
  const gw = cols * 2 + 1;
  const gh = rows * 2 + 1;
  const walls = Array.from({ length: gh }, () => Array(gw).fill(true));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  const stack = [[0, 0]];
  visited[0][0] = true;
  walls[1][1] = false; // open the start cell
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const opts = [];
    for (const [dc, dr] of dirs) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !visited[nr][nc]) {
        opts.push([nc, nr, dc, dr]);
      }
    }
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [nc, nr, dc, dr] = opts[Math.floor(rng() * opts.length)];
    visited[nr][nc] = true;
    // Carve the wall between this cell and the chosen neighbour, plus the
    // neighbour cell itself.
    walls[r * 2 + 1 + dr][c * 2 + 1 + dc] = false;
    walls[nr * 2 + 1][nc * 2 + 1] = false;
    stack.push([nc, nr]);
  }

  return { gw, gh, walls, cols, rows };
}

// True if two adjacent cells are connected (the wall between them is carved).
function connected(maze, c, r, dc, dr) {
  return !maze.walls[r * 2 + 1 + dr][c * 2 + 1 + dc];
}

// BFS from a start cell over the cell graph. Returns a 2D array of distances
// (in cells), -1 where unreachable (never happens in a perfect maze).
export function cellDistances(maze, sc, sr) {
  const { cols, rows } = maze;
  const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const q = [[sc, sr]];
  dist[sr][sc] = 0;
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  let head = 0;
  while (head < q.length) {
    const [c, r] = q[head++];
    for (const [dc, dr] of dirs) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      if (dist[nr][nc] !== -1) continue;
      if (!connected(maze, c, r, dc, dr)) continue;
      dist[nr][nc] = dist[r][c] + 1;
      q.push([nc, nr]);
    }
  }
  return dist;
}

// The cell furthest (by path length) from the start — where the Heart is hidden.
export function farthestCell(maze, sc, sr) {
  const dist = cellDistances(maze, sc, sr);
  let best = { c: sc, r: sr, d: 0 };
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if (dist[r][c] > best.d) best = { c, r, d: dist[r][c] };
    }
  }
  return best;
}

// All cell coordinates, optionally excluding some, shuffled by the rng. Used to
// scatter treasures and critters across distinct rooms.
export function shuffledCells(maze, rng, exclude = []) {
  const ex = new Set(exclude.map(({ c, r }) => `${c},${r}`));
  const cells = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if (!ex.has(`${c},${r}`)) cells.push({ c, r });
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

// Is a wall-grid tile open (walkable)?
export function isOpenTile(maze, gx, gy) {
  return (
    gx >= 0 && gy >= 0 && gx < maze.gw && gy < maze.gh && !maze.walls[gy][gx]
  );
}
