/**
 * HiLo Sound Engine — Web Audio API (procedural, zero external files)
 * Respects the global `agy_sound_enabled` localStorage key used by SoundToggle.
 */

const SOUND_KEY = "agy_sound_enabled";

function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(SOUND_KEY);
  return v === "false";
}

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new AudioContext();
  }
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

/** Ramp a gain node from 0 → peak → 0 for a clean sound envelope */
function envelope(
  ctx: AudioContext,
  gain: GainNode,
  peak: number,
  attackMs: number,
  decayMs: number,
  sustainMs: number,
  releaseMs: number
) {
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attackMs / 1000);
  gain.gain.linearRampToValueAtTime(peak * 0.7, now + (attackMs + decayMs) / 1000);
  gain.gain.setValueAtTime(peak * 0.7, now + (attackMs + decayMs + sustainMs) / 1000);
  gain.gain.linearRampToValueAtTime(0, now + (attackMs + decayMs + sustainMs + releaseMs) / 1000);
}

/** Play a single sine/square/sawtooth tone */
function playTone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  peakGain: number,
  attackMs: number,
  decayMs: number,
  sustainMs: number,
  releaseMs: number,
  startOffset = 0
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset / 1000);
  gain.gain.setValueAtTime(0, ctx.currentTime + startOffset / 1000);
  const now = ctx.currentTime + startOffset / 1000;
  gain.gain.linearRampToValueAtTime(peakGain, now + attackMs / 1000);
  gain.gain.linearRampToValueAtTime(peakGain * 0.7, now + (attackMs + decayMs) / 1000);
  gain.gain.setValueAtTime(peakGain * 0.7, now + (attackMs + decayMs + sustainMs) / 1000);
  gain.gain.linearRampToValueAtTime(0, now + (attackMs + decayMs + sustainMs + releaseMs) / 1000);
  const total = (startOffset + attackMs + decayMs + sustainMs + releaseMs) / 1000;
  osc.start(ctx.currentTime + startOffset / 1000);
  osc.stop(ctx.currentTime + total + 0.05);
}

/** Generate a white-noise burst (for card swish / click) */
function playNoise(ctx: AudioContext, durationMs: number, peakGain: number, lpFreq: number) {
  const bufSize = Math.ceil(ctx.sampleRate * (durationMs / 1000));
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = lpFreq;

  const gain = ctx.createGain();
  src.connect(lp);
  lp.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(peakGain, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  src.start(now);
  src.stop(now + durationMs / 1000 + 0.05);
}

/* ─── Public sound API ─────────────────────────────────────── */

/** Soft swish when a card is dealt */
export function soundCardDeal() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    playNoise(ctx, 120, 0.18, 2400);
    playTone(ctx, 320, "sine", 0.06, 5, 30, 40, 45);
  } catch {}
}

/** Rising two-note chime for clicking "Higher" */
export function soundHigherClick() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    playTone(ctx, 523, "sine", 0.12, 5, 20, 40, 80); // C5
    playTone(ctx, 659, "sine", 0.10, 5, 20, 40, 80, 130); // E5
  } catch {}
}

/** Falling two-note chime for clicking "Lower" */
export function soundLowerClick() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    playTone(ctx, 659, "sine", 0.12, 5, 20, 40, 80); // E5
    playTone(ctx, 523, "sine", 0.10, 5, 20, 40, 80, 130); // C5
  } catch {}
}

/** Triumphant rising arpeggio on win */
export function soundWin() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    // C5 → E5 → G5 → C6 arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      playTone(ctx, f, "sine", 0.18, 10, 40, 60, 120, i * 110);
    });
    // add a shimmer layer
    playTone(ctx, 2093, "sine", 0.05, 10, 80, 200, 300, 350);
  } catch {}
}

/** Descending minor chord on bust */
export function soundLose() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    // C5 → Eb5 → G4 (minor, descending)
    playTone(ctx, 523, "sawtooth", 0.12, 5, 60, 80, 200);
    playTone(ctx, 622, "sawtooth", 0.09, 5, 60, 80, 200, 80);
    playTone(ctx, 392, "sawtooth", 0.10, 5, 60, 100, 280, 180);
    // low thud
    playTone(ctx, 80, "sine", 0.25, 5, 50, 60, 200);
  } catch {}
}

/** Quick ping when multiplier increases */
export function soundMultiplierUp() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    playTone(ctx, 880, "sine", 0.10, 3, 15, 20, 50);
    playTone(ctx, 1320, "sine", 0.06, 3, 10, 15, 40, 60);
  } catch {}
}

/** Tinkle sparkle for win streak ≥ 3 */
export function soundStreakBonus() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const sparkle = [1047, 1319, 1568, 2093, 2637];
    sparkle.forEach((f, i) => {
      playTone(ctx, f, "sine", 0.08, 3, 10, 10, 30, i * 55);
    });
  } catch {}
}

/** Satisfying coin-clink when cashing out */
export function soundCashout() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    // metallic clink: square wave + noise
    playTone(ctx, 1200, "square", 0.08, 2, 20, 30, 180);
    playTone(ctx, 1800, "square", 0.05, 2, 10, 20, 140, 40);
    playTone(ctx, 900,  "square", 0.06, 2, 20, 40, 200, 90);
    playNoise(ctx, 40, 0.06, 4000);
    // rising win arpeggio after coin
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      playTone(ctx, f, "sine", 0.14, 5, 30, 50, 100, 200 + i * 90);
    });
  } catch {}
}

/** Subtle click for generic button presses */
export function soundButtonClick() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    playNoise(ctx, 18, 0.07, 1800);
  } catch {}
}
