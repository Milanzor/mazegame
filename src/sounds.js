// Minimal procedural sound effects via the Web Audio API — no audio files.
// Browsers block audio until the first user gesture, so we lazily create the
// context and resume it on demand.
let ctx = null;
let muted = false;

// Mute state (toggled by the in-game 🔊/🔇 button, persisted via storage).
export function setMuted(m) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Call once on a pointer event to satisfy autoplay policies.
export function unlockAudio() {
  ac();
}

// Play a short tone. type: 'sine' | 'triangle' | 'square'.
function tone(freq, duration, when = 0, type = 'sine', gain = 0.18) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(a.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

// Bright "ding" when a treasure is collected.
export function playCollect() {
  tone(660, 0.1, 0, 'triangle', 0.15); // E5
  tone(990, 0.14, 0.07, 'triangle', 0.15); // B5
}

// Warm chord for picking up a star milestone.
export function playStar() {
  tone(784, 0.12, 0, 'triangle', 0.14);
  tone(1175, 0.16, 0.08, 'triangle', 0.14);
}

// Gentle "bonk" when bumping a critter (not scary).
export function playBump() {
  tone(150, 0.16, 0, 'sine', 0.18);
  tone(100, 0.2, 0.05, 'sine', 0.14);
}

// Little tap blip for buttons.
export function playTap() {
  tone(620, 0.07, 0, 'square', 0.08);
}

// Triumphant island fanfare for reaching the Heart of Te Fiti.
export function playWin() {
  const notes = [523, 659, 784, 1047, 1319]; // C E G C E
  notes.forEach((f, i) => tone(f, 0.24, i * 0.13, 'triangle', 0.16));
}
