import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from '../main.js';
import { createBackground, enableContainerTap, makeMuteButton, hiRes } from '../background.js';
import { LEVELS } from '../levels.js';
import { THEMES } from '../themes.js';
import { setStars } from '../storage.js';
import { makeRng, pick } from '../util.js';
import {
  generateMaze,
  farthestCell,
  shuffledCells,
  isOpenTile,
} from '../maze.js';
import { unlockAudio, playCollect, playStar, playBump, playWin, playTap } from '../sounds.js';

const TOP_SAFE = 104; // keep the maze clear of the HUD bar

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.levelIndex = data.level || 0;
    this.cfg = LEVELS[this.levelIndex];
    this.theme = THEMES[this.cfg.themeIndex];
    this.rng = makeRng(0x9e3779b1 ^ (this.levelIndex * 2654435761));
    this.collected = 0;
    this.over = false;
    this.elapsed = 0;
    this.invulnUntil = 0;
    this.frozenUntil = 0;
  }

  create() {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    hiRes(this);
    createBackground(this, this.theme);
    this.cameras.main.fadeIn(300, 6, 30, 44);

    // ---- Build the maze layout ----------------------------------------
    this.maze = generateMaze(this.cfg.cols, this.cfg.rows, this.rng);
    this.layoutMaze();

    // ---- Pick start, goal, treasure & critter cells -------------------
    const start = { c: 0, r: 0 };
    const goal = farthestCell(this.maze, start.c, start.r);
    const free = shuffledCells(this.maze, this.rng, [start, goal]);
    const treasureCells = free.slice(0, this.cfg.treasures);
    const critterCells = free.slice(this.cfg.treasures, this.cfg.treasures + this.cfg.critters);
    const decoCells = free.slice(this.cfg.treasures + this.cfg.critters);

    // ---- Draw floor + walls, then build wall colliders ----------------
    this.drawMaze();
    this.scatterDecorations(decoCells);
    this.buildColliders();

    // ---- The Heart of Te Fiti (goal) ----------------------------------
    this.placeHeart(goal);

    // ---- Treasures -----------------------------------------------------
    this.treasureGroup = this.physics.add.group();
    treasureCells.forEach((cell, i) => this.placeTreasure(cell, i));

    // ---- Start marker (canoe) -----------------------------------------
    const sp = this.cellCenter(start.c, start.r);
    this.add.image(sp.x, sp.y, 'canoe').setScale((this.tile * 0.9) / 110 / RENDER_SCALE).setDepth(0).setAlpha(0.9);

    // ---- Vaiana --------------------------------------------------------
    this.hero = this.physics.add.image(sp.x, sp.y, 'vaiana');
    this.hero.setScale((this.tile * 0.82) / 120 / RENDER_SCALE).setDepth(10);
    this.setCircleBody(this.hero, this.tile * 0.3);
    this.hero.setCollideWorldBounds(true);
    this.physics.world.setBounds(this.mx, this.my, this.mwpx, this.mhpx);
    this.target = { x: sp.x, y: sp.y };
    this.maxSpeed = Math.max(300, this.tile * 8);

    // ---- Critters ------------------------------------------------------
    this.critterGroup = this.physics.add.group();
    critterCells.forEach((cell) => this.placeCritter(cell));

    // ---- Collisions & overlaps ----------------------------------------
    this.physics.add.collider(this.hero, this.wallBodies);
    this.physics.add.overlap(this.hero, this.treasureGroup, this.onCollect, null, this);
    this.physics.add.overlap(this.hero, this.critterGroup, this.onBump, null, this);
    this.physics.add.overlap(this.hero, this.heart, this.onReachHeart, null, this);

    // ---- Input ---------------------------------------------------------
    this.input.on('pointerdown', (p) => {
      unlockAudio();
      this.setTarget(p);
    });
    this.input.on('pointermove', (p) => {
      if (p.isDown) this.setTarget(p);
    });

    // ---- HUD + timer ---------------------------------------------------
    this.buildHud();
    this.tickEvent = this.time.addEvent({ delay: 1000, loop: true, callback: this.onTick, callbackScope: this });

    // A little "go!" nudge: pulse the heart-direction hint once.
    this.intro();
  }

  // ---- Maze geometry ---------------------------------------------------
  layoutMaze() {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const areaX = 24;
    const areaY = TOP_SAFE + 8;
    const areaW = W - 48;
    const areaH = H - areaY - 16;
    const { gw, gh } = this.maze;
    this.tile = Math.floor(Math.min(areaW / gw, areaH / gh));
    this.mwpx = this.tile * gw;
    this.mhpx = this.tile * gh;
    this.mx = areaX + (areaW - this.mwpx) / 2;
    this.my = areaY + (areaH - this.mhpx) / 2;
  }

  tileCenter(gx, gy) {
    return { x: this.mx + (gx + 0.5) * this.tile, y: this.my + (gy + 0.5) * this.tile };
  }
  cellCenter(c, r) {
    return this.tileCenter(c * 2 + 1, r * 2 + 1);
  }

  // Give a sprite a circular physics body of the requested *world* radius,
  // centred on its frame regardless of the sprite's display scale.
  setCircleBody(sprite, worldR) {
    const s = sprite.scaleX; // = factor / RENDER_SCALE
    const rSrc = worldR / s; // radius in source-frame pixels
    sprite.body.setCircle(rSrc, sprite.width / 2 - rSrc, sprite.height / 2 - rSrc);
  }

  // ---- Rendering -------------------------------------------------------
  drawMaze() {
    const { gw, gh, walls } = this.maze;
    const t = this.tile;
    const th = this.theme;
    const g = this.add.graphics().setDepth(-50);

    // Rounded path base (so outer corners look soft under the wall border).
    g.fillStyle(th.pathA, 1);
    g.fillRoundedRect(this.mx, this.my, this.mwpx, this.mhpx, t * 0.5);

    // Per-tile floor shading on open tiles — a gentle checker shimmer.
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        if (walls[y][x]) continue;
        g.fillStyle((x + y) & 1 ? th.pathB : th.pathA, 1);
        g.fillRect(this.mx + x * t, this.my + y * t, t, t);
      }
    }

    // Sculpted walls: oversized rounded blocks (so neighbours merge) with a
    // drop shadow and a top highlight — reads like reef / hedge / rock / basalt.
    const pad = 1;
    const rad = t * 0.34;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        if (!walls[y][x]) continue;
        const px = this.mx + x * t;
        const py = this.my + y * t;
        g.fillStyle(th.wallShadow, 1);
        g.fillRoundedRect(px - pad + 2, py - pad + 3, t + pad * 2, t + pad * 2, rad);
        g.fillStyle(th.wall, 1);
        g.fillRoundedRect(px - pad, py - pad, t + pad * 2, t + pad * 2, rad);
        g.fillStyle(th.wallHi, 0.5);
        g.fillRoundedRect(px + 2, py + 2, t - 4, t * 0.42, rad * 0.7);
      }
    }
  }

  scatterDecorations(cells) {
    const th = this.theme;
    // Use about half the leftover rooms so the maze feels furnished, not busy.
    const n = Math.min(cells.length, Math.max(4, Math.round(this.maze.cols * this.maze.rows * 0.45)));
    for (let i = 0; i < n; i++) {
      const cell = cells[i];
      const p = this.cellCenter(cell.c, cell.r);
      const key = pick(th.deco, this.rng);
      const jx = (this.rng() - 0.5) * this.tile * 0.4;
      const jy = (this.rng() - 0.5) * this.tile * 0.4;
      const d = this.add
        .image(p.x + jx, p.y + jy, key)
        .setScale((this.tile * 0.55) / 72 / RENDER_SCALE)
        .setDepth(1)
        .setAlpha(0.95);
      // Sway the leafy / grassy ones for life; gently pulse glowy lava props.
      if (key === 'grasstuft' || key === 'fern' || key === 'flowerpatch') {
        d.setOrigin(0.5, 0.9);
        this.tweens.add({ targets: d, angle: { from: -4, to: 4 }, duration: 2000 + this.rng() * 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else if (key === 'crystal' || key === 'lavacrack') {
        this.tweens.add({ targets: d, alpha: { from: 0.7, to: 1 }, duration: 900 + this.rng() * 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
  }

  buildColliders() {
    const { gw, gh, walls } = this.maze;
    const t = this.tile;
    this.wallBodies = [];
    // Merge horizontal runs of wall tiles into single static bodies (far fewer
    // bodies than one-per-tile, and collision stays seamless).
    for (let y = 0; y < gh; y++) {
      let x = 0;
      while (x < gw) {
        if (!walls[y][x]) {
          x++;
          continue;
        }
        const xs = x;
        while (x < gw && walls[y][x]) x++;
        const w = (x - xs) * t;
        const h = t;
        const cx = this.mx + xs * t + w / 2;
        const cy = this.my + y * t + h / 2;
        const z = this.add.zone(cx, cy, w, h);
        this.physics.add.existing(z, true);
        this.wallBodies.push(z);
      }
    }
  }

  placeHeart(goal) {
    const p = this.cellCenter(goal.c, goal.r);
    this.heartGlow = this.add.image(p.x, p.y, 'heartglow').setScale((this.tile * 1.6) / 240 / RENDER_SCALE).setDepth(3);
    this.heartGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.heartGlow, scale: (this.tile * 2.1) / 240 / RENDER_SCALE, alpha: 0.55, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.heart = this.physics.add.image(p.x, p.y, 'heart').setScale((this.tile * 0.7) / 120 / RENDER_SCALE).setDepth(4);
    this.heart.body.setAllowGravity(false);
    this.heart.setImmovable(true);
    this.setCircleBody(this.heart, this.tile * 0.34);
    this.tweens.add({ targets: this.heart, y: p.y - this.tile * 0.12, angle: { from: -8, to: 8 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  placeTreasure(cell, i) {
    const p = this.cellCenter(cell.c, cell.r);
    // A soft tinted halo so treasures glow and stand out from the scenery.
    const halo = this.add.image(p.x, p.y, 'glowdot').setScale((this.tile * 1.05) / 120 / RENDER_SCALE).setDepth(3).setTint(this.theme.accent);
    halo.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: halo, scale: (this.tile * 1.35) / 120 / RENDER_SCALE, alpha: 0.55, duration: 1100 + (i % 5) * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const tr = this.treasureGroup.create(p.x, p.y, this.theme.treasure).setScale((this.tile * 0.58) / 84 / RENDER_SCALE);
    tr.halo = halo;
    tr.setDepth(4);
    tr.body.setAllowGravity(false);
    tr.setImmovable(true);
    this.setCircleBody(tr, this.tile * 0.34);
    // Gentle bob + a sparkle so they invite the player over.
    this.tweens.add({ targets: tr, y: p.y - this.tile * 0.1, duration: 1200 + (i % 4) * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: tr, angle: { from: -8, to: 8 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  placeCritter(cell) {
    const gx = cell.c * 2 + 1;
    const gy = cell.r * 2 + 1;
    const p = this.tileCenter(gx, gy);
    const c = this.critterGroup.create(p.x, p.y, this.theme.enemy).setScale((this.tile * 0.66) / 96 / RENDER_SCALE);
    c.setDepth(6);
    c.body.setAllowGravity(false);
    this.setCircleBody(c, this.tile * 0.26);
    c.gx = gx;
    c.gy = gy;
    c.tx = gx;
    c.ty = gy;
    c.dirx = 0;
    c.diry = 0;
    this.pickNextTile(c);
    // Lifelike squish.
    this.tweens.add({ targets: c, scaleY: c.scaleY * 0.86, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  pickNextTile(c) {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    let opts = dirs.filter(([dx, dy]) => isOpenTile(this.maze, c.gx + dx, c.gy + dy));
    if (opts.length > 1) {
      // Avoid immediately reversing unless it's a dead end.
      opts = opts.filter(([dx, dy]) => !(dx === -c.dirx && dy === -c.diry));
    }
    const [dx, dy] = opts[Math.floor(this.rng() * opts.length)] || [0, 0];
    c.dirx = dx;
    c.diry = dy;
    c.tx = c.gx + dx;
    c.ty = c.gy + dy;
  }

  setTarget(p) {
    this.target = {
      x: Phaser.Math.Clamp(p.worldX, this.mx + this.tile * 0.5, this.mx + this.mwpx - this.tile * 0.5),
      y: Phaser.Math.Clamp(p.worldY, this.my + this.tile * 0.5, this.my + this.mhpx - this.tile * 0.5),
    };
  }

  intro() {
    // A quick directional sparkle trail from Vaiana toward the Heart on start.
    const a = Phaser.Math.Angle.Between(this.hero.x, this.hero.y, this.heart.x, this.heart.y);
    for (let i = 1; i <= 4; i++) {
      const s = this.add.image(this.hero.x + Math.cos(a) * i * 26, this.hero.y + Math.sin(a) * i * 26, 'spark').setScale(0.4 / RENDER_SCALE).setDepth(20).setAlpha(0);
      this.tweens.add({ targets: s, alpha: { from: 0, to: 0.9 }, duration: 240, delay: i * 90, yoyo: true, hold: 60, onComplete: () => s.destroy() });
    }
  }

  // ---- Gameplay events -------------------------------------------------
  onCollect(hero, tr) {
    if (this.over || tr.collected) return;
    tr.collected = true;
    tr.body.enable = false;
    playCollect();
    this.tweens.killTweensOf(tr);
    if (tr.halo) {
      this.tweens.killTweensOf(tr.halo);
      this.tweens.add({ targets: tr.halo, scale: tr.halo.scale * 1.8, alpha: 0, duration: 280, onComplete: () => tr.halo.destroy() });
    }
    this.sparkle(tr.x, tr.y);
    this.tweens.add({
      targets: tr,
      x: this.counterIcon.x,
      y: this.counterIcon.y,
      scale: 0.18 / RENDER_SCALE,
      duration: 520,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        tr.destroy();
        this.pulse(this.counterIcon);
      },
    });
    this.collected++;
    this.updateCounter();
    if (this.collected === this.cfg.treasures) {
      playStar();
      this.floatText(hero.x, hero.y - this.tile * 0.6, 'All found!', '#ffe066');
    }
  }

  onBump(hero, critter) {
    if (this.over || this.invulnUntil > this.time.now) return;
    this.invulnUntil = this.time.now + 1000;
    this.frozenUntil = this.time.now + 480; // brief, gentle stop
    playBump();
    this.cameras.main.shake(160, 0.006);
    hero.setVelocity(0, 0);
    hero.setTint(0xffaaaa);
    this.time.delayedCall(260, () => hero.clearTint());
    this.floatText(hero.x, hero.y - this.tile * 0.6, 'oops!', '#ffd277');
  }

  onReachHeart() {
    if (this.over) return;
    this.win();
  }

  onTick() {
    if (this.over) return;
    this.elapsed++;
    this.updateTimer();
  }

  // ---- Main loop -------------------------------------------------------
  update() {
    if (this.over) return;

    // Vaiana follows the finger, unless briefly frozen from a bump.
    const frozen = this.frozenUntil > this.time.now;
    if (frozen) {
      this.hero.setVelocity(this.hero.body.velocity.x * 0.6, this.hero.body.velocity.y * 0.6);
    } else {
      const dx = this.target.x - this.hero.x;
      const dy = this.target.y - this.hero.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const speed = Math.min(this.maxSpeed, dist * 6);
        const a = Math.atan2(dy, dx);
        this.hero.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
        this.hero.setFlipX(dx < 0);
        this.hero.setAngle(Phaser.Math.Clamp(dx * 0.04, -10, 10));
      } else {
        this.hero.setVelocity(this.hero.body.velocity.x * 0.8, this.hero.body.velocity.y * 0.8);
        this.hero.setAngle(this.hero.angle * 0.9);
      }
    }

    // Critters patrol the corridors, tile by tile.
    const speed = this.cfg.critterSpeed;
    this.critterGroup.children.iterate((c) => {
      if (!c || !c.active) return;
      const tc = this.tileCenter(c.tx, c.ty);
      const dx = tc.x - c.x;
      const dy = tc.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d < Math.max(2, speed * 0.02)) {
        c.body.reset(tc.x, tc.y);
        c.gx = c.tx;
        c.gy = c.ty;
        this.pickNextTile(c);
      } else {
        c.body.setVelocity((dx / d) * speed, (dy / d) * speed);
        c.setFlipX(dx < -0.5);
      }
    });
  }

  // ---- HUD -------------------------------------------------------------
  buildHud() {
    const W = GAME_WIDTH;
    const hud = this.add.container(0, 0).setDepth(100);
    const bar = this.add.graphics();
    bar.fillStyle(0x06222f, 0.5);
    bar.fillRoundedRect(16, 14, W - 32, 80, 28);
    hud.add(bar);

    // Treasure counter (left).
    this.counterIcon = this.add.image(64, 54, this.theme.treasure).setScale(0.5 / RENDER_SCALE).setDepth(101);
    this.counterText = this.add
      .text(104, 54, '', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '38px', color: '#ffffff' })
      .setOrigin(0, 0.5)
      .setDepth(101);
    this.updateCounter();

    // World + level name (centre).
    this.add
      .text(W / 2, 36, `${this.theme.emoji}  ${this.theme.name}  ·  Level ${this.levelIndex + 1}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#dffaff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(101);
    this.add
      .text(W / 2, 66, this.cfg.name, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(101);

    // Timer (right): elapsed time + a par bar that fills then turns red.
    this.add.text(W - 252, 22, '⏱', { fontSize: '28px' }).setDepth(101);
    this.timerText = this.add
      .text(W - 150, 38, '', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '32px', color: '#ffffff' })
      .setOrigin(1, 0.5)
      .setDepth(101);
    this.timerBar = this.add.graphics().setDepth(101);

    // Quit + mute, tucked into the corner under the bar.
    const quitImg = this.add.image(0, 0, 'circlebtn').setScale(0.4 / RENDER_SCALE);
    const quitIcon = this.add.text(0, -3, '☰', { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5);
    const quit = this.add.container(W - 46, 128, [quitImg, quitIcon]).setDepth(101);
    enableContainerTap(this, quit, 60, 60, quitImg, () => {
      playTap();
      this.scene.start('LevelSelect');
    });
    makeMuteButton(this, W - 112, 128, 0.4).setDepth(101);

    this.updateTimer();
  }

  updateCounter() {
    this.counterText.setText(`${this.collected} / ${this.cfg.treasures}`);
  }

  updateTimer() {
    this.timerText.setText(`${this.elapsed}s`);
    const W = GAME_WIDTH;
    const par = this.cfg.parTime;
    const frac = Phaser.Math.Clamp(this.elapsed / par, 0, 1);
    const full = 150;
    this.timerBar.clear();
    this.timerBar.fillStyle(0x06222f, 0.6);
    this.timerBar.fillRoundedRect(W - 226, 60, full, 12, 6);
    const over = this.elapsed > par;
    const color = over ? 0xff6b6b : frac > 0.7 ? 0xffd23c : 0x6ee06e;
    this.timerBar.fillStyle(color, 1);
    this.timerBar.fillRoundedRect(W - 226, 60, Math.max(2, full * frac), 12, 6);
  }

  // ---- Juice -----------------------------------------------------------
  sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(x, y, 'spark').setScale(0.5 / RENDER_SCALE).setDepth(20);
      const a = (i / 8) * Math.PI * 2;
      this.tweens.add({ targets: s, x: x + Math.cos(a) * this.tile * 0.8, y: y + Math.sin(a) * this.tile * 0.8, scale: 0, alpha: 0, duration: 600, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
    }
  }

  pulse(target) {
    this.tweens.add({ targets: target, scale: target.scale * 1.4, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
  }

  floatText(x, y, msg, color) {
    const t = this.add
      .text(x, y, msg, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '34px', color, stroke: '#0a3a55', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(30);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  // ---- Win -------------------------------------------------------------
  computeStars() {
    let stars = 1;
    if (this.collected >= this.cfg.treasures) stars++;
    if (this.elapsed <= this.cfg.parTime) stars++;
    return Math.min(3, stars);
  }

  win() {
    if (this.over) return;
    this.over = true;
    this.tickEvent.remove();
    this.hero.setVelocity(0, 0);
    this.critterGroup.children.iterate((c) => c && c.body && c.body.setVelocity(0, 0));
    playWin();

    // Big celebratory sparkle at the Heart.
    for (let i = 0; i < 16; i++) {
      this.time.delayedCall(i * 40, () => this.sparkle(this.heart.x, this.heart.y));
    }

    const stars = this.computeStars();
    setStars(this.levelIndex, stars);
    this.showEndPanel(stars);
  }

  showEndPanel(stars) {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    const dim = this.add.graphics().setDepth(199);
    dim.fillStyle(0x041019, 0.62);
    dim.fillRect(0, 0, W, H);

    const panel = this.add.container(W / 2, H / 2).setDepth(200);
    const g = this.add.graphics();
    g.fillStyle(0x06303f, 0.96);
    g.fillRoundedRect(-340, -240, 680, 480, 36);
    g.fillStyle(this.theme.wall, 1);
    g.fillRoundedRect(-340, -240, 680, 92, 36);
    g.fillRect(-340, -190, 680, 42);
    panel.add(g);

    panel.add(
      this.add
        .text(0, -194, 'You found the Heart! 🎉', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '42px', color: '#ffffff' })
        .setOrigin(0.5)
    );

    // Stars popping in.
    for (let s = 0; s < 3; s++) {
      const earned = s < stars;
      const star = this.add.image(-150 + s * 150, -70, earned ? 'star' : 'star-empty').setScale(0);
      panel.add(star);
      this.tweens.add({
        targets: star,
        scale: 1.0 / RENDER_SCALE,
        duration: 320,
        delay: 320 + s * 260,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (earned) {
            playStar();
            this.sparkle(panel.x - 150 + s * 150, panel.y - 70);
          }
        },
      });
    }

    // Breakdown lines.
    const allFound = this.collected >= this.cfg.treasures;
    const underPar = this.elapsed <= this.cfg.parTime;
    panel.add(this.add.text(0, 28, `${allFound ? '⭐' : '▫️'}  ${this.collected}/${this.cfg.treasures} ${this.theme.treasureName} found`, { fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#dffaff', fontStyle: 'bold' }).setOrigin(0.5));
    panel.add(this.add.text(0, 64, `${underPar ? '⭐' : '▫️'}  Time ${this.elapsed}s  (par ${this.cfg.parTime}s)`, { fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#dffaff', fontStyle: 'bold' }).setOrigin(0.5));

    // Buttons.
    const hasNext = this.levelIndex < LEVELS.length - 1;
    this.panelButton(panel, hasNext ? -200 : -110, 168, '☰ Levels', () => {
      playTap();
      this.scene.start('LevelSelect');
    });
    this.panelButton(panel, hasNext ? 0 : 110, 168, 'Replay', () => {
      playTap();
      this.scene.restart({ level: this.levelIndex });
    });
    if (hasNext) {
      this.panelButton(panel, 200, 168, 'Next ▶', () => {
        playTap();
        this.scene.restart({ level: this.levelIndex + 1 });
      });
    }

    panel.setScale(0);
    this.tweens.add({ targets: panel, scale: 1, duration: 420, ease: 'Back.easeOut' });
  }

  panelButton(panel, x, y, label, onClick) {
    const img = this.add.image(0, 0, 'btn').setScale(0.68 / RENDER_SCALE);
    const text = this.add.text(0, -3, label, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '26px', color: '#5a2d12' }).setOrigin(0.5);
    const c = this.add.container(x, y, [img, text]);
    panel.add(c);
    enableContainerTap(this, c, img.displayWidth, img.displayHeight, img, onClick);
  }
}
