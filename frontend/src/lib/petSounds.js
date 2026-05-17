// Synthesised pet sounds — pure Web Audio API, no asset files.
// Each pet has its own tiny signature (~120-400ms), volume kept low so the sound
// never overpowers reading or a typing flow.

const STORAGE_KEY = 'ethernal-pet-sound-muted';

let ctx = null;        // shared AudioContext (lazy)
let masterGain = null; // single gain node controlling global volume
let unlocked = false;

const MASTER_VOLUME = 0.16; // low — "subtle"

function ensureContext() {
  if (ctx) return ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.gain.value = MASTER_VOLUME;
    masterGain.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

// Browsers freeze AudioContexts created outside a user gesture. We resume on the
// first user-driven call (any click on the page works).
function unlockOnGesture() {
  if (unlocked) return;
  const handler = () => {
    const c = ensureContext();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
    unlocked = true;
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
  };
  window.addEventListener('pointerdown', handler, { once: true, passive: true });
  window.addEventListener('keydown', handler, { once: true });
}
unlockOnGesture();

export function isMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}
export function setMuted(muted) {
  try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
}

// ────────────────────────────────────────────────────────────────────────────
// Low-level helpers
// ────────────────────────────────────────────────────────────────────────────

function tone({ freq, type = 'sine', duration = 0.18, gain = 0.5, freqEnd = null, attack = 0.005, release = 0.05 }) {
  const c = ensureContext();
  if (!c || c.state === 'suspended') return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null) osc.frequency.linearRampToValueAtTime(freqEnd, t0 + duration);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.linearRampToValueAtTime(0, t0 + duration + release);
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + release + 0.02);
}

function noiseBurst({ duration = 0.18, gain = 0.4, highpass = 1500, lowpass = 6000 }) {
  const c = ensureContext();
  if (!c || c.state === 'suspended') return;
  const t0 = c.currentTime;
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Brown-ish noise — softer than pure white.
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buf;

  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = highpass;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = lowpass;

  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.linearRampToValueAtTime(0, t0 + duration);

  src.connect(hp).connect(lp).connect(g).connect(masterGain);
  src.start(t0);
  src.stop(t0 + duration + 0.05);
}

// ────────────────────────────────────────────────────────────────────────────
// Per-pet signatures
// ────────────────────────────────────────────────────────────────────────────

const PET_SOUNDS = {
  cat: () => {
    // Soft sleepy purr — two slow low waves.
    tone({ freq: 90, type: 'sawtooth', duration: 0.32, gain: 0.35, freqEnd: 75, attack: 0.04, release: 0.1 });
  },
  dog: () => {
    // Friendly yip — quick high pulse, slight drop.
    tone({ freq: 520, type: 'square', duration: 0.06, gain: 0.32, freqEnd: 380, attack: 0.005, release: 0.04 });
    setTimeout(() => tone({ freq: 460, type: 'square', duration: 0.05, gain: 0.28, freqEnd: 340, attack: 0.005, release: 0.04 }), 90);
  },
  rabbit: () => {
    // Tiny squeak — fast rising sine.
    tone({ freq: 650, type: 'sine', duration: 0.08, gain: 0.35, freqEnd: 980, attack: 0.005, release: 0.05 });
  },
  bird: () => {
    // Mystical chirp — warble between two pitches.
    tone({ freq: 740, type: 'triangle', duration: 0.06, gain: 0.32, freqEnd: 900, attack: 0.005, release: 0.04 });
    setTimeout(() => tone({ freq: 920, type: 'triangle', duration: 0.08, gain: 0.30, freqEnd: 680, attack: 0.005, release: 0.06 }), 70);
  },
  fish: () => {
    // Underwater bubble — short rising tone with quick fade.
    tone({ freq: 220, type: 'sine', duration: 0.10, gain: 0.34, freqEnd: 440, attack: 0.01, release: 0.06 });
  },
  squirrel: () => {
    // Quick double chirp.
    tone({ freq: 1050, type: 'square', duration: 0.04, gain: 0.28, attack: 0.005, release: 0.03 });
    setTimeout(() => tone({ freq: 1180, type: 'square', duration: 0.04, gain: 0.28, attack: 0.005, release: 0.03 }), 55);
  },
  cat_golden: () => {
    // Magical sparkle — fast arpeggio.
    [820, 1100, 1480].forEach((f, i) => {
      setTimeout(() => tone({ freq: f, type: 'triangle', duration: 0.06, gain: 0.30, attack: 0.003, release: 0.04 }), i * 50);
    });
  },
  dragon: () => {
    // Small ember crackle + low ember rumble.
    tone({ freq: 180, type: 'sawtooth', duration: 0.16, gain: 0.30, freqEnd: 90, attack: 0.01, release: 0.06 });
    noiseBurst({ duration: 0.12, gain: 0.22, highpass: 2200, lowpass: 5500 });
  },
  phoenix_pet: () => {
    // Fire whoosh — filtered noise rising slightly + bright bell.
    noiseBurst({ duration: 0.22, gain: 0.26, highpass: 1800, lowpass: 7000 });
    setTimeout(() => tone({ freq: 1200, type: 'sine', duration: 0.12, gain: 0.20, freqEnd: 900, attack: 0.005, release: 0.06 }), 60);
  },
};

export function playPetSound(petId) {
  if (!petId || petId === 'none') return;
  if (isMuted()) return;
  const fn = PET_SOUNDS[petId];
  if (!fn) return;
  try { fn(); } catch { /* fail silently — pet sounds are non-essential */ }
}
