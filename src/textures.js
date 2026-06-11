import Phaser from 'phaser';
import { RENDER_SCALE } from './main.js';

// Procedurally draws every sprite the game needs onto cached textures, so the
// whole game ships with zero image files. Everything is bright, rounded and
// storybook-cartoonish. Called once from the Boot scene.
//
// Each texture is baked at RENDER_SCALE resolution (we scale the Graphics, not
// the drawing code) so it stays crisp on HiDPI screens; scenes counter this by
// dividing display scales by RENDER_SCALE, leaving on-screen sizes unchanged.

function bake(scene, key, w, h, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.setScale(RENDER_SCALE);
  g.generateTexture(key, Math.ceil(w * RENDER_SCALE), Math.ceil(h * RENDER_SCALE));
  g.destroy();
}

// ---- Shared little drawing helpers -----------------------------------------

// Two cute eyes with a white highlight.
function eyes(g, cx, cy, spacing, r) {
  for (const dir of [-1, 1]) {
    const ex = cx + (spacing ? dir * spacing : 0);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex, cy, r);
    g.fillStyle(0x2a2233, 1);
    g.fillCircle(ex + dir * r * 0.18, cy + r * 0.12, r * 0.55);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex + dir * r * 0.18 - r * 0.2, cy - r * 0.2, r * 0.22);
    if (!spacing) break; // single cyclops-ish eye when spacing is 0
  }
}

// A happy smile arc.
function smile(g, cx, cy, w, color = 0x3a2233) {
  g.lineStyle(4, color, 1);
  g.beginPath();
  g.arc(cx, cy, w, Phaser.Math.DegToRad(18), Phaser.Math.DegToRad(162), false);
  g.strokePath();
}

// A simple round flower of 5 petals.
function flower(g, cx, cy, r, petal, center) {
  g.fillStyle(petal, 1);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.fillCircle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.62);
  }
  g.fillStyle(center, 1);
  g.fillCircle(cx, cy, r * 0.5);
}

// Soft radial glow built from stacked translucent circles.
function glow(g, cx, cy, maxR, color, strength = 0.08) {
  for (let i = 7; i > 0; i--) {
    g.fillStyle(color, strength);
    g.fillCircle(cx, cy, (maxR * i) / 7);
  }
}

// A five/ten-point star path.
function drawStar(g, cx, cy, outer, inner, color) {
  g.fillStyle(color, 1);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}

export function createTextures(scene) {
  // =========================================================================
  // LANI — the hero, a front-facing chibi (flips L/R, leans into movement)
  // =========================================================================
  bake(scene, 'hero', 120, 144, (g) => {
    const HAIR = 0x241712;
    const HAIRHI = 0x3a2418;
    const SKIN = 0x8a5a36;
    const TOP = 0xc0392b;
    // Long flowing hair down the sides (behind everything).
    g.fillStyle(HAIR, 1);
    g.fillRoundedRect(14, 56, 22, 80, 11);
    g.fillRoundedRect(84, 56, 22, 80, 11);
    // Hair back of the head.
    g.fillCircle(60, 58, 47);
    // Shoulders / off-shoulder top.
    g.fillStyle(TOP, 1);
    g.fillRoundedRect(24, 102, 72, 42, 22);
    g.fillStyle(0xe05a4c, 1);
    g.fillRoundedRect(28, 106, 64, 16, 12); // top highlight band
    // Face.
    g.fillStyle(SKIN, 1);
    g.fillCircle(60, 58, 38);
    g.fillStyle(0x9d6a42, 0.5);
    g.fillEllipse(60, 70, 56, 30); // soft jaw shade
    // Hair fringe / bangs.
    g.fillStyle(HAIR, 1);
    g.fillEllipse(60, 36, 84, 46);
    g.fillTriangle(20, 40, 40, 30, 38, 64); // left point
    g.fillTriangle(100, 40, 80, 30, 82, 64); // right point
    g.fillStyle(HAIRHI, 1);
    g.fillEllipse(60, 30, 64, 22); // sheen on top
    // Face features.
    eyes(g, 60, 60, 14, 8);
    smile(g, 60, 74, 9);
    // Rosy cheeks.
    g.fillStyle(0xd9745a, 0.5);
    g.fillCircle(40, 70, 7);
    g.fillCircle(80, 70, 7);
    // Flower tucked in her hair.
    flower(g, 90, 40, 11, 0xff5d8f, 0xffe066);
    // A little gem pendant on her necklace.
    g.lineStyle(3, 0xe8c98a, 1);
    g.beginPath();
    g.arc(60, 100, 16, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
    g.strokePath();
    g.fillStyle(0x2ec4b6, 1);
    g.fillCircle(60, 116, 7);
    g.fillStyle(0x9af0e6, 1);
    g.fillCircle(58, 114, 2.5);
  });

  // =========================================================================
  // THE SPIRIT STONE — glowing greenstone spiral (the goal)
  // =========================================================================
  bake(scene, 'stone', 120, 120, (g) => {
    glow(g, 60, 60, 58, 0x4dffd0, 0.07);
    // Stone body.
    g.fillStyle(0x0f6f5e, 1);
    g.fillCircle(60, 60, 44);
    g.fillStyle(0x1f9e86, 1);
    g.fillCircle(60, 60, 39);
    g.fillStyle(0x34c9ac, 1);
    g.fillCircle(60, 56, 33);
    // Glossy top highlight.
    g.fillStyle(0xbafff0, 0.35);
    g.fillEllipse(54, 44, 36, 18);
    // The spiral.
    g.lineStyle(5, 0xeafff9, 0.95);
    g.beginPath();
    let a = -Math.PI / 2;
    let r = 3;
    g.moveTo(60, 60);
    for (let i = 0; i < 64; i++) {
      a += 0.34;
      r += 0.52;
      g.lineTo(60 + Math.cos(a) * r, 60 + Math.sin(a) * r);
    }
    g.strokePath();
    // Centre gem dot + sparkle.
    g.fillStyle(0xffffff, 1);
    g.fillCircle(60, 60, 4);
    drawStar(g, 86, 40, 7, 3, 0xffffff);
  });

  // A separate soft glow disc, pulsed under the Spirit Stone in-scene.
  bake(scene, 'stoneglow', 240, 240, (g) => {
    glow(g, 120, 120, 118, 0x4dffd0, 0.06);
  });

  // Soft white halo placed (tinted) behind each treasure so collectibles glow
  // and read as "pick me up", clearly distinct from the scenery decorations.
  bake(scene, 'glowdot', 120, 120, (g) => {
    glow(g, 60, 60, 58, 0xffffff, 0.1);
  });

  // =========================================================================
  // TREASURES — one per world
  // =========================================================================
  // Ocean: scallop shell (a wide fan opening upward from a small hinge).
  bake(scene, 'shell', 88, 80, (g) => {
    const cx = 44;
    const cy = 70;
    const R = 46;
    // Fan body.
    g.fillStyle(0xffc7a0, 1);
    g.beginPath();
    g.moveTo(cx, cy);
    for (let a = 208; a <= 332; a += 8) {
      const rad = Phaser.Math.DegToRad(a);
      g.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
    }
    g.closePath();
    g.fillPath();
    // Soft top highlight.
    g.fillStyle(0xfff0e2, 0.5);
    g.beginPath();
    g.moveTo(cx, cy);
    for (let a = 215; a <= 325; a += 8) {
      const rad = Phaser.Math.DegToRad(a);
      g.lineTo(cx + Math.cos(rad) * R * 0.62, cy + Math.sin(rad) * R * 0.62);
    }
    g.closePath();
    g.fillPath();
    // Radiating ridges.
    g.lineStyle(3, 0xe98a4a, 0.85);
    for (let a = 215; a <= 325; a += 13.75) {
      const rad = Phaser.Math.DegToRad(a);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
      g.strokePath();
    }
    // Hinge knob.
    g.fillStyle(0xe98a4a, 1);
    g.fillCircle(cx, cy, 8);
    g.fillStyle(0xffd0a3, 1);
    g.fillCircle(cx, cy - 2, 3);
  });

  // Meadow: bright flower.
  bake(scene, 'flower', 84, 84, (g) => {
    g.fillStyle(0x2e8b57, 1);
    g.fillRoundedRect(40, 44, 4, 34, 2); // stem
    flower(g, 42, 38, 24, 0xff5d8f, 0xffe066);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(34, 30, 5);
  });

  // Jungle: berries.
  bake(scene, 'berry', 84, 84, (g) => {
    g.fillStyle(0x2e8b57, 1);
    g.fillTriangle(42, 18, 24, 30, 60, 30); // leaf
    g.fillStyle(0x3fae6a, 1);
    g.fillTriangle(42, 22, 30, 30, 54, 30);
    const berries = [
      [34, 48, 16],
      [54, 46, 15],
      [44, 62, 16],
    ];
    for (const [bx, by, br] of berries) {
      g.fillStyle(0xc0203a, 1);
      g.fillCircle(bx, by, br);
      g.fillStyle(0xe64158, 1);
      g.fillCircle(bx, by, br - 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(bx - br * 0.35, by - br * 0.35, br * 0.22);
    }
  });

  // Lava: amber gem.
  bake(scene, 'gem', 84, 84, (g) => {
    glow(g, 42, 44, 30, 0xffb02e, 0.07);
    g.fillStyle(0xffb02e, 1);
    g.fillTriangle(42, 16, 14, 40, 70, 40); // crown
    g.fillTriangle(14, 40, 70, 40, 42, 74); // pavilion
    g.fillStyle(0xffd277, 1);
    g.fillTriangle(42, 20, 26, 40, 58, 40);
    g.lineStyle(2, 0xffe6a8, 0.8);
    g.beginPath();
    g.moveTo(14, 40);
    g.lineTo(70, 40);
    g.moveTo(42, 16);
    g.lineTo(42, 40);
    g.strokePath();
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(34, 32, 3);
  });

  // =========================================================================
  // CRITTERS — gentle, bouncy obstacles (one per world)
  // =========================================================================
  // Ocean: crab.
  bake(scene, 'crab', 96, 88, (g) => {
    g.fillStyle(0xe55039, 1);
    // legs
    g.lineStyle(6, 0xc0392b, 1);
    for (const dir of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(48 + dir * 18, 56 + i * 6);
        g.lineTo(48 + dir * 42, 50 + i * 12);
        g.strokePath();
      }
    }
    // claws
    g.fillStyle(0xe55039, 1);
    g.fillCircle(16, 36, 12);
    g.fillCircle(80, 36, 12);
    g.lineStyle(5, 0xe55039, 1);
    g.beginPath();
    g.moveTo(22, 44);
    g.lineTo(40, 52);
    g.moveTo(74, 44);
    g.lineTo(56, 52);
    g.strokePath();
    // body
    g.fillStyle(0xe55039, 1);
    g.fillEllipse(48, 54, 56, 40);
    g.fillStyle(0xff7a5c, 1);
    g.fillEllipse(48, 48, 44, 22);
    // eyes on stalks
    g.lineStyle(4, 0xc0392b, 1);
    g.beginPath();
    g.moveTo(40, 40);
    g.lineTo(38, 24);
    g.moveTo(56, 40);
    g.lineTo(58, 24);
    g.strokePath();
    eyes(g, 48, 22, 10, 7);
    smile(g, 48, 58, 8);
  });

  // Meadow: bumble bee.
  bake(scene, 'bee', 96, 88, (g) => {
    // wings
    g.fillStyle(0xcfeeff, 0.8);
    g.fillEllipse(36, 28, 30, 22);
    g.fillEllipse(60, 28, 30, 22);
    // body
    g.fillStyle(0xffd23c, 1);
    g.fillEllipse(48, 52, 58, 44);
    g.fillStyle(0x2b2b2b, 1);
    for (const bx of [38, 52]) g.fillRoundedRect(bx, 32, 9, 40, 4);
    g.fillStyle(0x2b2b2b, 1);
    g.fillTriangle(74, 52, 88, 46, 88, 58); // stinger
    // face
    g.fillStyle(0xffe487, 1);
    g.fillCircle(28, 52, 16);
    eyes(g, 28, 50, 7, 6);
    smile(g, 28, 60, 6);
  });

  // Jungle: ladybug.
  bake(scene, 'ladybug', 92, 84, (g) => {
    g.fillStyle(0x1c1c1c, 1);
    g.fillCircle(46, 46, 36); // body base / head
    g.fillStyle(0xe0394b, 1);
    g.fillCircle(46, 50, 33);
    g.fillStyle(0x1c1c1c, 1);
    g.fillRoundedRect(44, 18, 4, 64, 2); // wing split
    g.fillCircle(46, 24, 13); // head
    const spots = [
      [32, 44],
      [60, 44],
      [30, 64],
      [62, 64],
      [46, 70],
    ];
    for (const [sx, sy] of spots) g.fillCircle(sx, sy, 6);
    eyes(g, 46, 22, 7, 6);
  });

  // Lava: friendly fire sprite.
  bake(scene, 'lavabubble', 92, 96, (g) => {
    glow(g, 46, 52, 44, 0xff7b00, 0.09);
    // little flame tips on top
    g.fillStyle(0xff8a2c, 1);
    g.fillTriangle(46, 6, 34, 36, 58, 36);
    g.fillTriangle(28, 22, 22, 44, 40, 40);
    g.fillTriangle(64, 22, 70, 44, 52, 40);
    // molten body
    g.fillStyle(0xff5b1a, 1);
    g.fillCircle(46, 58, 34);
    g.fillStyle(0xff8a2c, 1);
    g.fillCircle(46, 60, 27);
    g.fillStyle(0xffd23c, 1);
    g.fillCircle(46, 62, 17);
    eyes(g, 46, 58, 11, 7);
    smile(g, 46, 72, 7);
  });

  // =========================================================================
  // AMBIENT PARTICLES — drift across the background per world
  // =========================================================================
  bake(scene, 'bubble', 36, 36, (g) => {
    g.lineStyle(3, 0xffffff, 0.7);
    g.strokeCircle(18, 18, 13);
    g.fillStyle(0xffffff, 0.18);
    g.fillCircle(18, 18, 13);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(13, 13, 4);
  });
  bake(scene, 'petal', 34, 34, (g) => {
    g.fillStyle(0xff8fc4, 1);
    g.fillEllipse(17, 17, 22, 12);
    g.fillStyle(0xffffff, 0.4);
    g.fillEllipse(13, 14, 8, 5);
  });
  bake(scene, 'leaf', 36, 36, (g) => {
    g.fillStyle(0x6fc24a, 1);
    g.beginPath();
    g.moveTo(6, 28);
    g.lineTo(30, 6);
    g.lineTo(28, 24);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x3f8b2c, 1);
    g.beginPath();
    g.moveTo(8, 27);
    g.lineTo(27, 9);
    g.strokePath();
  });
  bake(scene, 'ember', 30, 30, (g) => {
    glow(g, 15, 15, 14, 0xffae3c, 0.12);
    g.fillStyle(0xffd277, 1);
    g.fillCircle(15, 15, 6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(13, 13, 2.5);
  });

  // =========================================================================
  // SCATTER DECORATIONS — small props dropped on the maze floor & background
  // =========================================================================
  bake(scene, 'starfish', 72, 72, (g) => {
    drawStar(g, 36, 38, 30, 14, 0xffa83c);
    drawStar(g, 36, 36, 30, 14, 0xffc46b);
    g.fillStyle(0xffe3ab, 1);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      g.fillCircle(36 + Math.cos(a) * 14, 36 + Math.sin(a) * 14, 2.5);
    }
    g.fillCircle(36, 36, 3);
  });
  bake(scene, 'pebble', 64, 48, (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(34, 36, 50, 18);
    const stones = [
      [22, 28, 14, 0x9fb0bb],
      [42, 30, 16, 0x8294a0],
      [33, 22, 12, 0xb6c4cd],
    ];
    for (const [sx, sy, sr, col] of stones) {
      g.fillStyle(col, 1);
      g.fillCircle(sx, sy, sr);
      g.fillStyle(0xffffff, 0.25);
      g.fillEllipse(sx - sr * 0.2, sy - sr * 0.4, sr, sr * 0.5);
    }
  });
  bake(scene, 'coralbit', 72, 72, (g) => {
    const cols = [0xff7e9d, 0xffae54, 0xff5d8f];
    for (let i = 0; i < 3; i++) {
      g.fillStyle(cols[i], 1);
      const x = 22 + i * 14;
      g.fillRoundedRect(x, 28 - i * 4, 12, 40 + i * 6, 6);
      g.fillCircle(x + 6, 28 - i * 4, 9);
    }
  });
  bake(scene, 'flowerpatch', 84, 64, (g) => {
    g.fillStyle(0x3f8b2c, 1);
    for (let i = 0; i < 6; i++) g.fillRoundedRect(12 + i * 11, 36, 4, 24, 2);
    flower(g, 24, 34, 12, 0xff5d8f, 0xffe066);
    flower(g, 48, 28, 13, 0xffd23c, 0xff8a3c);
    flower(g, 66, 36, 11, 0xb18cff, 0xffe066);
  });
  bake(scene, 'grasstuft', 72, 60, (g) => {
    g.fillStyle(0x57a93b, 1);
    for (let i = 0; i < 7; i++) {
      const x = 14 + i * 7;
      const lean = (i - 3) * 4;
      g.fillTriangle(x, 56, x - 5, 56, x + lean, 14 + (i % 3) * 6);
    }
    g.fillStyle(0x6fc24a, 1);
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 8;
      g.fillTriangle(x, 56, x - 4, 56, x + (i - 2) * 5, 22);
    }
  });
  bake(scene, 'mushroom', 64, 64, (g) => {
    g.fillStyle(0xf3e6cf, 1);
    g.fillRoundedRect(26, 34, 12, 24, 6); // stem
    g.fillStyle(0xe0394b, 1);
    g.beginPath();
    g.arc(32, 34, 24, Math.PI, Math.PI * 2, false);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(22, 24, 4);
    g.fillCircle(40, 26, 5);
    g.fillCircle(32, 18, 3.5);
  });
  bake(scene, 'fern', 80, 76, (g) => {
    g.lineStyle(4, 0x2f7d34, 1);
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      g.moveTo(40, 72);
      g.lineTo(40 + k * 24, 12);
      g.strokePath();
    }
    g.fillStyle(0x4fae3f, 1);
    for (let k = -1; k <= 1; k++) {
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const x = 40 + k * 24 * t;
        const y = 72 - 60 * t;
        g.fillEllipse(x, y, 16 - i, 7);
      }
    }
  });
  bake(scene, 'rock', 72, 60, (g) => {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(38, 50, 56, 16);
    g.fillStyle(0x2a1a14, 1);
    g.fillRoundedRect(12, 18, 52, 34, 14);
    g.fillStyle(0x4a2c1f, 1);
    g.fillRoundedRect(16, 18, 44, 16, 10);
    g.fillStyle(0xff6a2c, 0.5);
    g.fillRoundedRect(20, 40, 36, 5, 3); // lava seam underneath
  });
  bake(scene, 'crystal', 72, 78, (g) => {
    glow(g, 36, 44, 30, 0xff8a3c, 0.06);
    const shards = [
      [36, 10, 0xffb02e],
      [22, 26, 0xff7b2c],
      [52, 30, 0xffd277],
    ];
    for (const [cx, base, col] of shards) {
      g.fillStyle(col, 1);
      g.fillTriangle(cx, base, cx - 8, 70, cx + 8, 70);
      g.fillStyle(0xffffff, 0.3);
      g.fillTriangle(cx, base, cx - 3, 50, cx, 50);
    }
  });
  bake(scene, 'lavacrack', 80, 64, (g) => {
    glow(g, 40, 34, 26, 0xff5b1a, 0.07);
    g.lineStyle(7, 0x1a0805, 1);
    g.beginPath();
    g.moveTo(8, 24);
    g.lineTo(28, 34);
    g.lineTo(44, 26);
    g.lineTo(66, 40);
    g.strokePath();
    g.lineStyle(3, 0xff7b2c, 1);
    g.beginPath();
    g.moveTo(8, 24);
    g.lineTo(28, 34);
    g.lineTo(44, 26);
    g.lineTo(66, 40);
    g.strokePath();
    g.fillStyle(0xffd277, 1);
    g.fillCircle(28, 34, 3);
    g.fillCircle(44, 26, 3);
  });

  // Start marker — the hero's little canoe, drawn top-down.
  bake(scene, 'canoe', 110, 70, (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(56, 52, 96, 26);
    g.fillStyle(0x6b3f1d, 1);
    g.fillEllipse(55, 35, 100, 44); // hull
    g.fillStyle(0x8a5a2b, 1);
    g.fillEllipse(55, 33, 86, 34);
    g.fillStyle(0x4a2b13, 1);
    g.fillEllipse(55, 33, 66, 22); // inner
    // outrigger
    g.fillStyle(0x6b3f1d, 1);
    g.fillRoundedRect(10, 18, 90, 6, 3);
    g.fillRoundedRect(10, 46, 90, 6, 3);
    g.fillEllipse(96, 35, 16, 40);
    // little mast dot
    g.fillStyle(0xc0392b, 1);
    g.fillCircle(55, 33, 7);
  });

  // Palm tree — background flourish for the menus.
  bake(scene, 'palm', 130, 170, (g) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(64, 162, 90, 18);
    // curved trunk
    g.fillStyle(0x8a5a2b, 1);
    g.beginPath();
    g.moveTo(54, 160);
    g.lineTo(70, 160);
    g.lineTo(82, 60);
    g.lineTo(66, 60);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x6b3f1d, 0.8);
    for (let i = 0; i < 6; i++) {
      const y = 150 - i * 16;
      g.beginPath();
      g.moveTo(56 + i, y);
      g.lineTo(70 + i, y);
      g.strokePath();
    }
    // fronds
    g.fillStyle(0x2f9e4f, 1);
    const cx = 74;
    const cy = 56;
    const fronds = [
      [-60, -6],
      [-40, -40],
      [0, -54],
      [40, -40],
      [58, -4],
      [-20, 8],
      [24, 8],
    ];
    for (const [dx, dy] of fronds) {
      g.fillStyle(dx < 0 ? 0x2f9e4f : 0x3fae5f, 1);
      g.fillTriangle(cx, cy, cx + dx, cy + dy, cx + dx * 0.6, cy + dy + 18);
    }
    // coconuts
    g.fillStyle(0x6b3f1d, 1);
    g.fillCircle(66, 60, 7);
    g.fillCircle(82, 62, 7);
  });

  // =========================================================================
  // STARS + SPARKLES + UI BUTTONS
  // =========================================================================
  bake(scene, 'star', 100, 100, (g) => {
    glow(g, 50, 52, 46, 0xffd23c, 0.05);
    drawStar(g, 50, 52, 44, 19, 0xe8a000);
    drawStar(g, 50, 50, 44, 19, 0xffd23c);
    drawStar(g, 46, 44, 16, 7, 0xffffff);
  });
  bake(scene, 'star-empty', 100, 100, (g) => {
    drawStar(g, 50, 50, 44, 19, 0x6a5a3a);
    drawStar(g, 50, 50, 36, 15, 0x4a3f28);
  });
  bake(scene, 'spark', 40, 40, (g) => {
    g.fillStyle(0xffffff, 0.95);
    drawStar(g, 20, 20, 18, 6, 0xffffff);
  });

  // Reusable soft pill button (warm island colours).
  bake(scene, 'btn', 280, 96, (g) => {
    g.fillStyle(0x5a2d12, 0.32);
    g.fillRoundedRect(6, 12, 268, 84, 42);
    g.fillStyle(0xffb43c, 1);
    g.fillRoundedRect(0, 0, 280, 88, 44);
    g.fillStyle(0xffd277, 1);
    g.fillRoundedRect(8, 6, 264, 34, 26);
  });

  // Round icon button.
  bake(scene, 'circlebtn', 132, 132, (g) => {
    g.fillStyle(0x5a2d12, 0.32);
    g.fillCircle(66, 72, 56);
    g.fillStyle(0xff7a3c, 1);
    g.fillCircle(66, 64, 56);
    g.fillStyle(0xffa86b, 1);
    g.fillEllipse(66, 46, 72, 30);
  });
}
