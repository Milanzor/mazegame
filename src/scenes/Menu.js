import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from '../main.js';
import { createBackground, makeButton, makeMuteButton, hiRes } from '../background.js';
import { THEMES } from '../themes.js';
import { getTotalStars } from '../storage.js';

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    hiRes(this);
    createBackground(this, THEMES[0]); // sunny ocean title backdrop

    // Palm trees framing the scene.
    this.add.image(110, H, 'palm').setOrigin(0.5, 1).setScale(1.4 / RENDER_SCALE).setDepth(-10);
    this.add.image(W - 110, H, 'palm').setOrigin(0.5, 1).setScale(1.5 / RENDER_SCALE).setFlipX(true).setDepth(-10);

    // The glowing Heart of Te Fiti floating above the title.
    const glow = this.add.image(W / 2, H * 0.30, 'heartglow').setScale(1.1 / RENDER_SCALE).setDepth(0);
    this.tweens.add({ targets: glow, scale: 1.35 / RENDER_SCALE, alpha: 0.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const heart = this.add.image(W / 2, H * 0.30, 'heart').setScale(0.9 / RENDER_SCALE).setDepth(1);
    this.tweens.add({ targets: heart, y: heart.y - 16, angle: { from: -6, to: 6 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Vaiana waving beside the title.
    const v = this.add.image(W * 0.30, H * 0.52, 'vaiana').setScale(1.5 / RENDER_SCALE).setDepth(2);
    this.tweens.add({ targets: v, angle: { from: -5, to: 5 }, y: v.y - 12, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title.
    const title = this.add
      .text(W / 2, H * 0.50, "Vaiana's\nMaze", {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '92px',
        color: '#ffffff',
        align: 'center',
        stroke: '#0a3a55',
        strokeThickness: 14,
        lineSpacing: -14,
      })
      .setOrigin(0.5);
    title.setShadow(0, 7, '#063048', 10, false, true);
    this.tweens.add({ targets: title, scale: { from: 1, to: 1.04 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add
      .text(W / 2, H * 0.64, 'Find the Heart of Te Fiti', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        color: '#eafff9',
        fontStyle: 'bold',
        stroke: '#0a3a55',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // Total stars collected so far.
    const total = getTotalStars();
    this.add.image(W / 2 - 58, H * 0.73, 'star').setScale(0.5 / RENDER_SCALE);
    this.add
      .text(W / 2 - 16, H * 0.73, `${total} / 60`, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '44px',
        color: '#ffffff',
        stroke: '#0a3a55',
        strokeThickness: 8,
      })
      .setOrigin(0, 0.5);

    // Big friendly PLAY button.
    makeButton(this, W / 2, H * 0.87, '▶  PLAY', () => this.scene.start('LevelSelect'), 1.3);

    // Sound on/off toggle in the top-right corner.
    makeMuteButton(this, W - 70, 64, 0.5);
  }
}
