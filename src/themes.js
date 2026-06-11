// The four worlds Vaiana journeys through, in order. The map changes every 5
// levels (see levels.js), so theme = floor(levelIndex / 5). Each theme carries a
// full palette plus the keys of its themed treasure, critter, ambient particles
// and scatter decorations — everything the renderer needs to dress a level so it
// feels alive and distinct.

export const THEMES = [
  {
    key: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    // Full-screen background gradient (top → bottom).
    bgTop: 0x49c6f0,
    bgBottom: 0x06314c,
    // The walkable maze floor (two tints, lerped per-tile for a watery shimmer).
    pathA: 0x2f86b0,
    pathB: 0x1d6a98,
    // The maze walls (coral-rock reefs), with highlight + shadow for sculpting.
    wall: 0x0a3a57,
    wallHi: 0x1d5e83,
    wallShadow: 0x041f30,
    accent: 0x66e0ff,
    treasure: 'shell',
    treasureName: 'shells',
    enemy: 'crab',
    enemyName: 'crab',
    particle: 'bubble',
    deco: ['starfish', 'pebble', 'coralbit'],
    names: ['Coral Shallows', 'Turtle Lagoon', 'Open Sea', 'Reef Labyrinth', 'Stormy Deep'],
  },
  {
    key: 'tefiti',
    name: 'Te Fiti',
    emoji: '🌺',
    bgTop: 0x9be86b,
    bgBottom: 0x1f7a3a,
    pathA: 0x6fc24a,
    pathB: 0x57a93b,
    wall: 0x1f5e2c,
    wallHi: 0x37873f,
    wallShadow: 0x0f3a1a,
    accent: 0xff7eb6,
    treasure: 'flower',
    treasureName: 'flowers',
    enemy: 'bee',
    enemyName: 'bee',
    particle: 'petal',
    deco: ['flowerpatch', 'grasstuft', 'pebble'],
    names: ['Blossom Shore', 'Flower Fields', 'Vine Tangle', 'Sacred Grove', 'Heart Meadow'],
  },
  {
    key: 'nature',
    name: 'Jungle',
    emoji: '🌴',
    bgTop: 0x3f9b53,
    bgBottom: 0x10321b,
    pathA: 0x4f7a39,
    pathB: 0x3c6029,
    wall: 0x33240f,
    wallHi: 0x4e3a1c,
    wallShadow: 0x190f05,
    accent: 0x9fe06a,
    treasure: 'berry',
    treasureName: 'berries',
    enemy: 'ladybug',
    enemyName: 'ladybug',
    particle: 'leaf',
    deco: ['mushroom', 'fern', 'pebble'],
    names: ['Forest Edge', 'Bamboo Path', 'Deep Jungle', 'Hidden Falls', 'Cliff Caverns'],
  },
  {
    key: 'lava',
    name: 'Lava',
    emoji: '🌋',
    bgTop: 0x7a1f12,
    bgBottom: 0x150705,
    pathA: 0x5a241a,
    pathB: 0x431a12,
    wall: 0x2a0e08,
    wallHi: 0x5e2412,
    wallShadow: 0x0c0403,
    accent: 0xff8a2c,
    treasure: 'gem',
    treasureName: 'gems',
    enemy: 'lavabubble',
    enemyName: 'fire sprite',
    particle: 'ember',
    deco: ['rock', 'crystal', 'lavacrack'],
    names: ['Ash Plains', 'Ember Caves', 'Lava Flows', "Te Kā's Lair", 'Heart of Te Fiti'],
  },
];

export const THEMES_PER_GROUP = 5; // levels before the map changes

export function themeForLevel(levelIndex) {
  return THEMES[Math.min(Math.floor(levelIndex / THEMES_PER_GROUP), THEMES.length - 1)];
}
