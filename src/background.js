import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from './main.js';
import { unlockAudio, isMuted, setMuted, playTap } from './sounds.js';
import { saveMuted } from './storage.js';
import { mix } from './util.js';

// Point a scene's camera at the logical 1280×720 world inside the hi-res render
// buffer: zoom by RENDER_SCALE and centre on the logical canvas. This lets every
// scene keep using plain 1280×720 coordinates while the buffer (and the
// RENDER_SCALE-baked textures) deliver a crisp, super-sampled image. Call once
// at the top of a scene's create().
export function hiRes(scene) {
  const cam = scene.cameras.main;
  cam.setZoom(RENDER_SCALE);
  cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
}

// Paints a themed, living backdrop: a vertical gradient, soft light, and a
// steady drift of that world's ambient particles (bubbles / petals / leaves /
// embers). Returns nothing — it just decorates the scene behind everything.
export function createBackground(scene, theme, { particles = true } = {}) {
  const W = GAME_WIDTH;
  const H = GAME_HEIGHT;

  // Banded vertical gradient. Drawn as solid stripes (via mix) rather than
  // Graphics.fillGradientStyle so it renders identically on WebGL *and* the
  // Canvas fallback renderer — the lush backdrop is never lost.
  const bg = scene.add.graphics().setDepth(-100);
  const BANDS = 48;
  for (let i = 0; i < BANDS; i++) {
    bg.fillStyle(mix(theme.bgTop, theme.bgBottom, i / (BANDS - 1)), 1);
    bg.fillRect(0, Math.floor((H * i) / BANDS), W, Math.ceil(H / BANDS) + 1);
  }

  // Slanting light rays for a touch of depth.
  const rays = scene.add.graphics().setDepth(-99);
  rays.fillStyle(0xffffff, 0.05);
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 230;
    rays.fillTriangle(x, -50, x + 90, -50, x - 120, H + 50);
  }
  rays.setBlendMode(Phaser.BlendModes.ADD);

  // A soft vignette to settle the edges.
  const vig = scene.add.graphics().setDepth(-98);
  vig.fillStyle(theme.bgBottom, 0.35);
  vig.fillRect(0, 0, W, 60);
  vig.fillRect(0, H - 60, W, 60);

  if (particles) driftParticles(scene, theme);
}

// Ambient particles for the menus and behind the maze. Embers rise; everything
// else drifts gently down/around — each world reads instantly different.
export function driftParticles(scene, theme) {
  const W = GAME_WIDTH;
  const H = GAME_HEIGHT;
  const rises = theme.particle === 'bubble' || theme.particle === 'ember';
  scene.time.addEvent({
    delay: 360,
    loop: true,
    callback: () => {
      const x = Phaser.Math.Between(10, W - 10);
      const startY = rises ? H + 20 : -20;
      const endY = rises ? -30 : H + 30;
      const scale = Phaser.Math.FloatBetween(0.4, 1.2) / RENDER_SCALE;
      const p = scene.add
        .image(x, startY, theme.particle)
        .setScale(scale)
        .setDepth(-90)
        .setAlpha(0.75);
      if (theme.particle === 'ember') p.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p,
        y: endY,
        x: x + Phaser.Math.Between(-70, 70),
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(4500, 9000),
        ease: 'Sine.easeInOut',
        onComplete: () => p.destroy(),
      });
    },
  });
}

// A reusable pill button (texture 'btn') with a centered label. Returns the
// container so callers can position/animate it. Touch-friendly hit area.
export function makeButton(scene, x, y, label, onClick, scale = 1) {
  const img = scene.add.image(0, 0, 'btn').setScale(scale / RENDER_SCALE);
  const text = scene.add
    .text(0, -4, label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Math.round(34 * scale)}px`,
      color: '#5a2d12',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [img, text]);
  enableContainerTap(scene, c, img.displayWidth, img.displayHeight, img, onClick);
  return c;
}

// Makes a container tappable via an invisible interactive child Zone (NOT a
// manual hit-area on the container). A child Zone's world transform is resolved
// through the full parent chain, so taps land on the art even when the button is
// nested inside another container (e.g. a result panel). The padding makes the
// target forgiving for little fingers on a tablet.
export function enableContainerTap(scene, container, w, h, visual, onClick) {
  const PAD = 26;
  const zone = scene.add
    .zone(0, 0, w + PAD, h + PAD)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  container.add(zone); // last child → on top for input; zones never render
  bindTap(scene, zone, visual || container, onClick);
  return zone;
}

// Shared tap behaviour: a little squish on press, fire on release. `target` is
// the interactive object (a Zone or image); `visual` is what gets squished.
// Also resumes the audio context on first press to satisfy autoplay policies.
export function bindTap(scene, target, visual, onClick) {
  const base = visual.scale;
  target.on('pointerdown', () => {
    unlockAudio();
    scene.tweens.add({ targets: visual, scale: base * 0.9, duration: 80 });
  });
  const release = () => {
    scene.tweens.add({ targets: visual, scale: base, duration: 120, ease: 'Back.easeOut' });
  };
  target.on('pointerup', () => {
    release();
    onClick();
  });
  target.on('pointerout', release);
}

// A round 🔊 / 🔇 toggle that mutes all sound effects and remembers the choice.
export function makeMuteButton(scene, x, y, scale = 0.5) {
  const img = scene.add.image(0, 0, 'circlebtn').setScale(scale / RENDER_SCALE);
  const ico = scene.add
    .text(0, -3, isMuted() ? '🔇' : '🔊', {
      fontSize: `${Math.round(70 * scale)}px`,
    })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [img, ico]);
  enableContainerTap(scene, c, img.displayWidth, img.displayHeight, img, () => {
    const m = !isMuted();
    setMuted(m);
    saveMuted(m);
    ico.setText(m ? '🔇' : '🔊');
    if (!m) playTap();
  });
  return c;
}
