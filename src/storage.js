// Tiny localStorage wrapper for saving the best star rating per level.
// Fails silently if storage is unavailable (e.g. private browsing).
const KEY = 'lani-maze-progress-v1';
const MUTE_KEY = 'lani-maze-muted-v1';

// Remembered sound on/off choice (defaults to sound ON).
export function getMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

export function saveMuted(m) {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch (e) {
    /* ignore */
  }
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    /* ignore */
  }
}

// Best stars earned on a given level (0 if never completed).
export function getStars(levelIndex) {
  return readAll()[levelIndex] || 0;
}

// Save stars only if better than what's already stored.
export function setStars(levelIndex, stars) {
  const data = readAll();
  if (stars > (data[levelIndex] || 0)) {
    data[levelIndex] = stars;
    writeAll(data);
  }
}

// A level is unlocked if it's the first one, or the previous one has 1+ stars.
export function isUnlocked(levelIndex) {
  if (levelIndex === 0) return true;
  return getStars(levelIndex - 1) > 0;
}

// Sum of all best stars — shown on the menu as a friendly grand total.
export function getTotalStars() {
  const data = readAll();
  return Object.values(data).reduce((a, b) => a + b, 0);
}
