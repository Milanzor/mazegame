import Phaser from 'phaser';
import { createTextures } from '../textures.js';

// Boot generates every texture once, then hands off to the menu. There are no
// external assets to load, so this is near-instant.
export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createTextures(this);
    this.scene.start('Menu');
  }
}
