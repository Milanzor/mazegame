import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from '../main.js';
import { createBackground, enableContainerTap, hiRes } from '../background.js';
import { LEVELS } from '../levels.js';
import { THEMES } from '../themes.js';
import { getStars, isUnlocked } from '../storage.js';
import { playTap } from '../sounds.js';

const PER_PAGE = 8; // 4 across, 2 down

export default class LevelSelect extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const W = GAME_WIDTH;
    hiRes(this);
    createBackground(this, THEMES[0], { particles: true });

    this.add
      .text(W / 2, 60, 'Pick a Level', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '58px',
        color: '#ffffff',
        stroke: '#0a3a55',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    // Grid geometry (a page of up to 8 cards: 4 across, 2 down).
    this.cols = 4;
    this.cardW = 240;
    this.cardH = 196;
    const gapX = 36;
    const gapY = 28;
    const gridW = this.cols * this.cardW + (this.cols - 1) * gapX;
    this.startX = (W - gridW) / 2 + this.cardW / 2;
    this.startY = 178;
    this.stepX = this.cardW + gapX;
    this.stepY = this.cardH + gapY;

    this.pageCount = Math.ceil(LEVELS.length / PER_PAGE);
    this.cards = [];

    // Open on the page holding the furthest unlocked level.
    let lastUnlocked = 0;
    for (let i = 0; i < LEVELS.length; i++) if (isUnlocked(i)) lastUnlocked = i;
    this.page = Math.floor(lastUnlocked / PER_PAGE);

    this.buildPageControls();
    this.renderPage(this.page);
    this.makeBack(86, 60);
  }

  buildPageControls() {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const y = H - 52;
    this.prevArrow = this.makeArrow(W / 2 - 160, y, '◀', () => this.flip(-1));
    this.nextArrow = this.makeArrow(W / 2 + 160, y, '▶', () => this.flip(1));
    this.pageText = this.add
      .text(W / 2, y, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#0a3a55',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
  }

  makeArrow(x, y, glyph, onClick) {
    const img = this.add.image(0, 0, 'circlebtn').setScale(0.6 / RENDER_SCALE);
    const txt = this.add.text(0, -4, glyph, { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);
    const c = this.add.container(x, y, [img, txt]);
    enableContainerTap(this, c, img.displayWidth, img.displayHeight, img, onClick);
    return c;
  }

  flip(dir) {
    playTap();
    this.renderPage(this.page + dir);
  }

  renderPage(p) {
    this.page = Phaser.Math.Clamp(p, 0, this.pageCount - 1);
    this.cards.forEach((c) => {
      this.tweens.killTweensOf(c);
      c.destroy();
    });
    this.cards = [];

    const start = this.page * PER_PAGE;
    const slice = LEVELS.slice(start, start + PER_PAGE);
    slice.forEach((lvl, j) => {
      const index = start + j;
      const cx = this.startX + (j % this.cols) * this.stepX;
      const cy = this.startY + Math.floor(j / this.cols) * this.stepY;
      this.cards.push(this.makeLevelCard(cx, cy, this.cardW, this.cardH, index, lvl));
    });

    this.pageText.setText(`${this.page + 1} / ${this.pageCount}`);
    this.prevArrow.setVisible(this.page > 0);
    this.nextArrow.setVisible(this.page < this.pageCount - 1);
  }

  makeLevelCard(cx, cy, w, h, index, lvl) {
    const unlocked = isUnlocked(index);
    const stars = getStars(index);
    const theme = THEMES[lvl.themeIndex];

    const card = this.add.container(cx, cy);

    const g = this.add.graphics();
    g.fillStyle(0x06222f, 0.42);
    g.fillRoundedRect(-w / 2 + 6, -h / 2 + 8, w, h, 26);
    g.fillStyle(unlocked ? theme.pathA : 0x3a4a52, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 26);
    // Themed header band in the world's wall colour.
    g.fillStyle(unlocked ? theme.wall : 0x2a363c, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, 56, 26);
    g.fillRect(-w / 2, -h / 2 + 30, w, 26);
    g.fillStyle(0xffffff, unlocked ? 0.14 : 0.06);
    g.fillRoundedRect(-w / 2 + 10, -h / 2 + 64, w - 20, h - 116, 18);
    card.add(g);

    // World emoji badge + level number.
    card.add(this.add.text(-w / 2 + 26, -h / 2 + 28, theme.emoji, { fontSize: '30px' }).setOrigin(0.5));
    card.add(
      this.add
        .text(0, -h / 2 + 28, `${index + 1}`, {
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: '34px',
          color: '#ffffff',
          stroke: '#0a3a55',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
    );

    if (unlocked) {
      // A preview treasure/heart icon in the body.
      card.add(this.add.image(0, -6, index % 20 === 19 ? 'heart' : theme.treasure).setScale(0.62 / RENDER_SCALE));
    } else {
      card.add(this.add.text(0, -6, '🔒', { fontSize: '46px' }).setOrigin(0.5));
    }

    // Level name.
    card.add(
      this.add
        .text(0, h / 2 - 56, lvl.name, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: w - 26 },
        })
        .setOrigin(0.5)
    );

    if (unlocked) {
      for (let s = 0; s < 3; s++) {
        const key = s < stars ? 'star' : 'star-empty';
        card.add(this.add.image(-50 + s * 50, h / 2 - 26, key).setScale(0.4 / RENDER_SCALE));
      }
      enableContainerTap(this, card, w, h, card, () => this.startLevel(index));
      this.tweens.add({ targets: card, alpha: { from: 1, to: 0.92 }, duration: 1200, yoyo: true, repeat: -1 });
    }

    return card;
  }

  startLevel(index) {
    this.cameras.main.fadeOut(250, 6, 30, 44);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', { level: index });
    });
  }

  makeBack(x, y) {
    const img = this.add.image(0, 0, 'circlebtn').setScale(0.8 / RENDER_SCALE);
    const arrow = this.add.text(0, -4, '⬅', { fontSize: '46px', color: '#ffffff' }).setOrigin(0.5);
    const c = this.add.container(x, y, [img, arrow]);
    enableContainerTap(this, c, 110, 110, img, () => this.scene.start('Menu'));
  }
}
