import Phaser from 'phaser';
import BootScene from './scenes/Boot.js';
import MenuScene from './scenes/Menu.js';
import LevelSelectScene from './scenes/LevelSelect.js';
import GameScene from './scenes/Game.js';
import { setMuted } from './sounds.js';
import { getMuted } from './storage.js';
import { initUpdateCheck } from './update-check.js';

// Restore the player's saved sound on/off choice before any scene plays a sound.
setMuted(getMuted());

// Logical design resolution. Phaser's Scale.FIT keeps these proportions and
// letterboxes as needed, so the layout is identical on phone, tablet and desktop.
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Render scale (super-sampling). Phaser's FIT mode draws into a buffer the size
// of the game config and then CSS-upscales it to fill the screen — which is
// blurry on HiDPI tablets (an iPad has a 2× display). So we render the buffer at
// `RENDER_SCALE × the logical size`, bake the procedural textures at the same
// multiple, and counter-scale on screen so the LAYOUT is pixel-identical — just
// far sharper. Capped at 2× (plenty for retina; more would waste GPU).
export const RENDER_SCALE = Math.min(Math.ceil(window.devicePixelRatio || 1), 2);

// Render every Text object at RENDER_SCALE resolution so glyphs stay crisp once
// the camera zooms the logical world up to fill the hi-res buffer. Done once,
// globally, so individual `this.add.text(...)` calls need no change.
const _text = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
  style = style || {};
  if (style.resolution === undefined) style.resolution = RENDER_SCALE;
  return _text.call(this, x, y, text, style);
};

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0a4a6e',
  width: GAME_WIDTH * RENDER_SCALE,
  height: GAME_HEIGHT * RENDER_SCALE,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Multi-touch: a few simultaneous pointers is plenty for a one-finger game.
  input: {
    activePointers: 3,
  },
  render: {
    antialias: true,
    roundPixels: true,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene],
};

const game = new Phaser.Game(config);

// Hide the HTML loading splash once the first scene is up and running.
game.events.once(Phaser.Core.Events.READY, () => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 500);
  }
});

// Reveal the ✨ button when a newer build has been deployed to GitHub Pages.
initUpdateCheck();

// ===========================================================================
// iPad / touch polish — stop double-tap and pinch from zooming or scrolling the
// page out from under the game. (iOS Safari ignores `user-scalable=no`, so the
// gestures have to be blocked in JS.) None of this interferes with the
// single-finger drag that steers Vaiana.
// ===========================================================================
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) e.preventDefault(); // double-tap zoom
    lastTouchEnd = now;
  },
  { passive: false }
);
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault()); // Safari pinch-zoom
}
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault(); // multi-finger pinch
  },
  { passive: false }
);
document.addEventListener('dblclick', (e) => e.preventDefault());
