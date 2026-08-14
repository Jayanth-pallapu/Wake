"use client";

import { useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   PREMIUM SOUND ENGINE — Web Audio API, zero external assets.
   All sounds are synthesized from oscillators + noise + filters.
═══════════════════════════════════════════════════════════════ */

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // Lazy-create a shared AudioContext
  if (!(window as any).__agy_audio_ctx) {
    try {
      (window as any).__agy_audio_ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  return (window as any).__agy_audio_ctx as AudioContext;
}

/** Resume AudioContext after user gesture (browser autoplay policy). */
function resumeCtx(ctx: AudioContext) {
  if (ctx.state === "suspended") ctx.resume();
}

/** Create a white-noise buffer source. */
function noiseSource(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.ceil(sr * duration), sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

/** Play a simple oscillator tone with envelope. */
function playTone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  gainPeak: number,
  attack: number,
  decay: number,
  startTime: number,
  freqEnd?: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, freqEnd), startTime + attack + decay);
  }
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + attack + decay + 0.01);
}

/* ─────────────────────────────────────────────────────────────
   CRASH GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Rocket launch — rising whoosh + bass thud */
export function soundRocketLaunch() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;

  // Bass thud
  playTone(ctx, 120, "sine", 0.6, 0.01, 0.25, t, 40);
  // Rising whoosh (noise + high-pass filter)
  const noise = noiseSource(ctx, 0.6);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.setValueAtTime(200, t);
  hp.frequency.exponentialRampToValueAtTime(3000, t + 0.6);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.linearRampToValueAtTime(0.05, t + 0.6);
  noise.connect(hp); hp.connect(gain); gain.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.6);
  // Ascending sweep
  playTone(ctx, 80, "sawtooth", 0.15, 0.05, 0.55, t, 400);
}

/** Tick sound — short metallic click as multiplier climbs */
export function soundMultiplierTick(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Higher pitch and slightly louder as multiplier climbs
  const freq = 800 + Math.min(mult * 60, 2000);
  playTone(ctx, freq, "triangle", 0.12, 0.004, 0.06, t);
}

/** Milestone flash sound — triumphant chime chord */
export function soundMilestone(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = mult >= 100 ? 880 : mult >= 50 ? 740 : mult >= 10 ? 660 : mult >= 5 ? 587 : 523;
  // Chord: root + major third + fifth
  playTone(ctx, base,          "sine", 0.35, 0.01, 0.4, t);
  playTone(ctx, base * 1.25,   "sine", 0.28, 0.01, 0.4, t + 0.03);
  playTone(ctx, base * 1.5,    "sine", 0.22, 0.01, 0.38, t + 0.06);
  playTone(ctx, base * 2,      "sine", 0.15, 0.01, 0.3, t + 0.1);
}

/** Cashout win — triumphant rising arpeggio + sparkle */
export function soundCashoutWin(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = 440;
  const notes = [base, base * 1.25, base * 1.5, base * 2, base * 2.5];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.4 - i * 0.04, 0.02, 0.4, t + i * 0.07);
  });
  // Extra sparkle for big wins
  if (mult >= 5) {
    playTone(ctx, 1760, "sine", 0.2, 0.01, 0.5, t + 0.35);
    playTone(ctx, 2093, "sine", 0.15, 0.01, 0.4, t + 0.42);
  }
}

/** Crash explosion — descending boom + noise burst */
export function soundCrashExplode() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;

  // Explosion boom — drop from 200Hz to near zero
  playTone(ctx, 200, "sine", 0.7, 0.01, 0.5, t, 20);
  playTone(ctx, 100, "sine", 0.5, 0.01, 0.6, t, 15);

  // Noise burst
  const noise = noiseSource(ctx, 0.5);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.setValueAtTime(2000, t);
  lp.frequency.exponentialRampToValueAtTime(100, t + 0.5);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.55, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  noise.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.55);

  // High-freq crack
  playTone(ctx, 3000, "sawtooth", 0.15, 0.001, 0.08, t, 100);
}

/* ─────────────────────────────────────────────────────────────
   DICE GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Dice rolling — rapid plastic rattle */
/** Single rattle tick — called from RAF loop, rate decreases with velocity. */
export function soundDiceRollTick(velocityFraction: number = 1) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Pitch and volume both scale with velocity: high-freq sharp tap → low woody thud
  const freq = 300 + velocityFraction * 900;
  const vol = 0.04 + velocityFraction * 0.1;
  playTone(ctx, freq, "square", vol, 0.002, 0.025 + (1 - velocityFraction) * 0.04, t);
  // Noise transient for texture
  const noise = noiseSource(ctx, 0.03);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 800 + velocityFraction * 1200;
  bp.Q.value = 4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol * 0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  noise.connect(bp); bp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.035);
}

export function soundDiceRoll() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // 8 rapid clicks building then fading
  for (let i = 0; i < 10; i++) {
    const delay = i * 0.065 * (1 - i * 0.015);
    const freq = 600 + Math.random() * 400;
    playTone(ctx, freq, "square", 0.08 + i * 0.01, 0.003, 0.04, t + delay);
    // Noise per click (rattle texture)
    const noise = noiseSource(ctx, 0.04);
    const lp = ctx.createBiquadFilter();
    lp.type = "bandpass"; lp.frequency.value = 1200 + Math.random() * 800;
    lp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t + delay);
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.04);
    noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
    noise.start(t + delay); noise.stop(t + delay + 0.05);
  }
}

/** Dice landing — satisfying weighted thud */
export function soundDiceLand() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;

  // Thud body
  playTone(ctx, 180, "sine", 0.55, 0.005, 0.18, t, 50);
  // Smack transient
  const noise = noiseSource(ctx, 0.08);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 800; bp.Q.value = 1.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  noise.connect(bp); bp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.1);
}

/** Dice win — bright rising chime arpeggio */
export function soundDiceWin() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.38 - i * 0.04, 0.01, 0.35, t + i * 0.08);
  });
  // Shimmer
  playTone(ctx, 2093, "sine", 0.18, 0.01, 0.45, t + 0.4);
}

/** Dice lose — low descending thud + buzz */
export function soundDiceLose() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Descending tone
  playTone(ctx, 300, "sawtooth", 0.25, 0.01, 0.35, t, 80);
  playTone(ctx, 150, "sine",     0.35, 0.01, 0.4, t, 60);
  // Short buzz
  const noise = noiseSource(ctx, 0.15);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 400;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.2);
}

/** Place bet click — satisfying UI confirm sound */
export function soundBetPlace() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 440, "sine", 0.18, 0.005, 0.12, t, 380);
  playTone(ctx, 880, "sine", 0.08, 0.005, 0.1, t + 0.04);
}

/* ─────────────────────────────────────────────────────────────
   PLINKO GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Helper: stereo panner node */
function stereoPan(ctx: AudioContext, pan: number): StereoPannerNode {
  const node = ctx.createStereoPanner();
  node.pan.value = Math.max(-1, Math.min(1, pan));
  return node;
}

/** Drop Ball whoosh — soft rising whoosh + subtle bass thud */
export function soundPlinkoDropBall() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Soft bass thud
  playTone(ctx, 90, "sine", 0.35, 0.008, 0.2, t, 35);
  // Rising whoosh
  const noise = noiseSource(ctx, 0.45);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.setValueAtTime(300, t);
  hp.frequency.exponentialRampToValueAtTime(2200, t + 0.45);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, t);
  g.gain.linearRampToValueAtTime(0.02, t + 0.45);
  noise.connect(hp); hp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.5);
  // Ascending sweep tone
  playTone(ctx, 60, "sawtooth", 0.1, 0.04, 0.4, t, 350);
}

/** Per-peg tick — metallic ping rising in pitch per row, stereo panned by direction */
export function soundPlinkoTick(row: number, dir: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Pitch rises from ~220Hz (row 0) to ~700Hz (row 15)
  const freq = 220 + row * 31;
  const vol = 0.06 + row * 0.004;
  const pan = stereoPan(ctx, dir === 1 ? 0.55 : -0.55);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.004);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.04);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  osc.connect(gain); gain.connect(pan); pan.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.06);
  // Noise transient for metallic texture
  const noise = noiseSource(ctx, 0.03);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 1800 + row * 80; bp.Q.value = 6;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol * 0.45, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  noise.connect(bp); bp.connect(ng); ng.connect(pan); pan.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.035);
}

/** Ball land — weighted thud, bass depth scales with multiplier */
export function soundPlinkoLand(multiplier: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const vol = Math.min(0.9, 0.4 + multiplier * 0.018);
  // Deep bass thud — drops to near 0 fast
  playTone(ctx, 160, "sine", vol, 0.005, 0.28, t, 18);
  playTone(ctx, 80, "sine", vol * 0.7, 0.005, 0.35, t, 12);
  // Impact transient noise
  const noise = noiseSource(ctx, 0.12);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.setValueAtTime(3000, t);
  lp.frequency.exponentialRampToValueAtTime(120, t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol * 0.6, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.15);
  // High resonant ping for notable wins
  if (multiplier >= 2) {
    const ping = 800 + multiplier * 40;
    playTone(ctx, Math.min(ping, 2400), "sine", 0.18, 0.005, 0.3, t + 0.03);
  }
}

/** Profit counter tick — ascending tick as counter rolls up */
export function soundPlinkoWinCount(progress: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const freq = 400 + progress * 420;
  playTone(ctx, freq, "sine", 0.045, 0.002, 0.028, t);
}

/** Win fanfare — 5-note C major arpeggio, staggered 70ms */
export function soundPlinkoWinFanfare(multiplier: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = multiplier >= 10 ? 523.25 : multiplier >= 4 ? 493.88 : 440;
  const notes = [base, base * 1.25, base * 1.5, base * 2, base * 2.5];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.38 - i * 0.05, 0.012, 0.5, t + i * 0.07);
  });
  // Brightness shimmer
  playTone(ctx, base * 4, "sine", 0.12, 0.01, 0.4, t + 0.35);
}

/** Big win fanfare — harmonic choir + shimmer for ≥10× */
export function soundPlinkoWinBig(multiplier: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.45 - i * 0.05, 0.015, 0.75, t + i * 0.065);
    // Harmonics (choir-like)
    playTone(ctx, freq * 1.005, "sine", 0.2 - i * 0.02, 0.02, 0.65, t + i * 0.065 + 0.01);
  });
  // Sustained shimmer
  playTone(ctx, 2093, "sine", 0.2, 0.02, 0.8, t + 0.42);
  playTone(ctx, 2637, "sine", 0.12, 0.02, 0.6, t + 0.6);
  if (multiplier >= 50) {
    playTone(ctx, 4186, "sine", 0.08, 0.02, 0.5, t + 0.75);
  }
}

/** Win shimmer — sustained high sparkle tone when "YOU WIN!" appears */
export function soundPlinkoWinShimmer() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 2093, "sine", 0.18, 0.02, 0.55, t, 2637);
  playTone(ctx, 1760, "sine", 0.12, 0.04, 0.5, t + 0.08);
}

/** Lose impact — deep boom when "YOU LOSE" slams in */
export function soundPlinkoLoseImpact() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Heavy descending boom
  playTone(ctx, 180, "sine", 0.75, 0.006, 0.55, t, 18);
  playTone(ctx, 90,  "sine", 0.55, 0.006, 0.65, t, 10);
  // Noise burst
  const noise = noiseSource(ctx, 0.5);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.setValueAtTime(2200, t);
  lp.frequency.exponentialRampToValueAtTime(80, t + 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.65, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.55);
  // High crack
  playTone(ctx, 2800, "sawtooth", 0.12, 0.001, 0.06, t, 80);
}

/** Lose rumble — low slow rumble during pulse rings */
export function soundPlinkoLoseRumble() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 55, "triangle", 0.28, 0.05, 0.9, t);
  playTone(ctx, 70, "sine",     0.18, 0.08, 0.8, t + 0.05);
}

/* ─────────────────────────────────────────────────────────────
   MINES GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Game start — satisfying power-on hum + rising sweep */
export function soundMinesBetStart() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Rising power sweep
  playTone(ctx, 80,  "sine", 0.28, 0.02, 0.35, t, 260);
  playTone(ctx, 160, "sine", 0.15, 0.04, 0.28, t + 0.08, 480);
  // Confirmation ping
  playTone(ctx, 880, "sine", 0.18, 0.005, 0.2, t + 0.25);
  playTone(ctx, 1320, "sine", 0.1, 0.005, 0.15, t + 0.3);
}

/** Safe tile picked — crystal chime, pitch + brightness rises with multiplier */
export function soundMinesGemReveal(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Base freq rises with multiplier (440Hz at 1x, up to 1760Hz at 10x+)
  const freq = Math.min(1760, 440 + Math.log2(Math.max(1, mult)) * 220);
  const vol  = Math.min(0.45, 0.22 + Math.log2(Math.max(1, mult)) * 0.04);
  // Crystal attack
  playTone(ctx, freq,       "sine", vol,      0.004, 0.3,  t);
  playTone(ctx, freq * 1.5, "sine", vol * 0.5, 0.004, 0.22, t + 0.008);
  playTone(ctx, freq * 2,   "sine", vol * 0.3, 0.004, 0.18, t + 0.012);
  // Shimmer tail
  playTone(ctx, freq * 4,   "sine", vol * 0.12, 0.01, 0.25, t + 0.025);
}

/** Mine hit — deep explosion boom + shatter debris */
export function soundMinesBombExplode() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Deep punch
  playTone(ctx, 60,  "sine", 0.9, 0.004, 0.45, t, 8);
  playTone(ctx, 30,  "sine", 0.7, 0.004, 0.55, t, 5);
  // Shatter noise burst — wide band, fast decay
  const noise = noiseSource(ctx, 0.6);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 200;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass";  lp.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.75, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  noise.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.6);
  // Metal crack
  playTone(ctx, 2800, "sawtooth", 0.18, 0.001, 0.08, t, 120);
  playTone(ctx, 1400, "sawtooth", 0.12, 0.001, 0.1,  t + 0.01, 80);
}

/** Cashout — ascending gold coin cascade */
export function soundMinesCashoutStart() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.35 - i * 0.04, 0.008, 0.4, t + i * 0.06);
    // Coin shimmer harmonic
    playTone(ctx, freq * 2, "sine", 0.1 - i * 0.01, 0.008, 0.25, t + i * 0.06 + 0.01);
  });
  playTone(ctx, 2093, "sine", 0.14, 0.01, 0.3, t + 0.32);
}

/** Win fanfare — 6-note choir arpeggio, scales with multiplier */
export function soundMinesWinFanfare(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = mult >= 10 ? 523.25 : mult >= 4 ? 493.88 : 440;
  const notes = [base, base * 1.25, base * 1.5, base * 2, base * 2.5, base * 3];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.42 - i * 0.05, 0.012, 0.65, t + i * 0.072);
    playTone(ctx, freq * 1.004, "sine", 0.18 - i * 0.02, 0.015, 0.55, t + i * 0.072 + 0.01);
  });
  playTone(ctx, base * 4, "sine", 0.16, 0.01, 0.5, t + 0.44);
  if (mult >= 5) playTone(ctx, base * 6, "sine", 0.1, 0.01, 0.4, t + 0.6);
}

/** Win shimmer — sustained sparkle when YOU WIN appears */
export function soundMinesWinShimmer() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 2093, "sine", 0.16, 0.02, 0.6, t, 2637);
  playTone(ctx, 1760, "sine", 0.1,  0.04, 0.5, t + 0.09);
  playTone(ctx, 2637, "sine", 0.08, 0.02, 0.4, t + 0.2);
}

/** Lose rumble — low impact + plate reverb tail */
export function soundMinesLoseRumble() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 50,  "triangle", 0.32, 0.04, 0.9, t);
  playTone(ctx, 75,  "sine",     0.22, 0.06, 0.8, t + 0.04);
  playTone(ctx, 100, "sine",     0.12, 0.08, 0.6, t + 0.1);
  // Noise tail (plate reverb sim)
  const noise = noiseSource(ctx, 0.15);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 400;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t + 0.15); noise.stop(t + 1.2);
}

/* ─────────────────────────────────────────────────────────────
   LIMBO GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Roll initiated — rising tension drone */
export function soundLimboRoll() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Rising sweep drone
  playTone(ctx, 55,  "sine", 0.22, 0.06, 0.55, t, 180);
  playTone(ctx, 110, "sine", 0.12, 0.08, 0.45, t + 0.05, 240);
  // Quick click trigger
  playTone(ctx, 800, "square", 0.08, 0.003, 0.04, t + 0.01);
}

/** Per-tick digital beep during number count-up (progress 0→1) */
export function soundLimboCountUp(progress: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Freq rises from 220Hz at progress=0 to 1760Hz at progress=1
  const freq = 220 + progress * 1540;
  const vol  = 0.08 + progress * 0.06;
  playTone(ctx, freq, "square", vol, 0.002, 0.04, t);
}

/** Tension pulse — fires when number is near target during reveal */
export function soundLimboTension() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 60, "triangle", 0.35, 0.005, 0.12, t);
  playTone(ctx, 65, "sine",     0.18, 0.008, 0.10, t + 0.04);
}

/** Win reveal — ascending chime burst + choir stab */
export function soundLimboWinReveal(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = mult >= 10 ? 587.33 : mult >= 5 ? 523.25 : 493.88;
  // Ascending 5-note chime burst
  [base, base*1.25, base*1.5, base*2, base*3].forEach((freq, i) => {
    playTone(ctx, freq,       "sine", 0.45 - i*0.06, 0.006, 0.55, t + i*0.065);
    playTone(ctx, freq*1.003, "sine", 0.15 - i*0.02, 0.01,  0.45, t + i*0.065 + 0.01);
  });
  // Choir stab on beat 3
  playTone(ctx, base*4, "sine", 0.18, 0.015, 0.4, t + 0.32);
  if (mult >= 5) playTone(ctx, base*6, "sine", 0.1, 0.01, 0.3, t + 0.48);
}

/** Lose reveal — falling drop + deep bass thud */
export function soundLimboLoseReveal() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Falling tone
  playTone(ctx, 440, "sine", 0.28, 0.01, 0.38, t, 55);
  // Bass thud
  playTone(ctx, 60,  "sine", 0.7,  0.003, 0.3, t + 0.1, 5);
  playTone(ctx, 35,  "sine", 0.5,  0.003, 0.4, t + 0.1, 5);
  // Short noise punch
  const noise = noiseSource(ctx, 0.35);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 300;
  const g  = ctx.createGain();
  g.gain.setValueAtTime(0.4, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t + 0.1); noise.stop(t + 0.55);
}

/** Win shimmer — high crystal sparkle when YOU WIN appears */
export function soundLimboWinShimmer() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 2093, "sine", 0.14, 0.015, 0.55, t, 2637);
  playTone(ctx, 1760, "sine", 0.09, 0.02,  0.45, t + 0.08);
  playTone(ctx, 2637, "sine", 0.07, 0.01,  0.38, t + 0.18);
}

/* ─────────────────────────────────────────────────────────────
   WHEEL GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Spin begins — mechanical whirr + rising pitch */
export function soundWheelSpinStart() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Rising mechanical sweep
  playTone(ctx, 90,  "sawtooth", 0.18, 0.04, 0.6, t, 320);
  playTone(ctx, 180, "sawtooth", 0.08, 0.06, 0.5, t + 0.05, 480);
  // Excitement hit
  playTone(ctx, 440, "sine", 0.12, 0.01, 0.15, t + 0.2);
  playTone(ctx, 660, "sine", 0.08, 0.01, 0.12, t + 0.24);
}

/** Segment tick during spin — speed param 0(slow) → 1(fast), adjusts pitch + vol */
export function soundWheelTick(speed: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const freq = 600 + speed * 800; // 600Hz slow → 1400Hz fast
  const vol  = 0.06 + speed * 0.06;
  playTone(ctx, freq, "square", vol, 0.001, 0.025, t);
}

/** Deceleration slow ticks — heavy, rhythmic, dramatic */
export function soundWheelSlowDown() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 350, "square",   0.14, 0.002, 0.07, t);
  playTone(ctx, 200, "triangle", 0.1,  0.004, 0.1,  t + 0.01);
}

/** Wheel lands — heavy thunk + resonant ring */
export function soundWheelLand() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Thunk
  playTone(ctx, 80,  "sine", 0.65, 0.003, 0.35, t, 8);
  playTone(ctx, 40,  "sine", 0.5,  0.003, 0.45, t, 4);
  // Resonant ring
  playTone(ctx, 880, "sine", 0.18, 0.008, 0.4,  t + 0.01);
  playTone(ctx, 1320,"sine", 0.08, 0.01,  0.3,  t + 0.02);
  // Short noise snap
  const noise = noiseSource(ctx, 0.25);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 800;
  const g  = ctx.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  noise.connect(hp); hp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.2);
}

/** Win fanfare — ascending brass/choir arpeggio, scales with multiplier */
export function soundWheelWinFanfare(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = mult >= 5 ? 587.33 : mult >= 2 ? 523.25 : 493.88;
  const notes = [base, base*1.25, base*1.5, base*2, base*2.5, base*3];
  notes.forEach((freq, i) => {
    playTone(ctx, freq,       "sine", 0.44 - i*0.055, 0.01, 0.65, t + i*0.07);
    playTone(ctx, freq*1.003, "sine", 0.16 - i*0.02,  0.015, 0.55, t + i*0.07 + 0.01);
  });
  playTone(ctx, base*4, "sine", 0.18, 0.012, 0.5, t + 0.45);
  if (mult >= 3) playTone(ctx, base*6, "sine", 0.1, 0.01, 0.4, t + 0.62);
}

/** Win shimmer — glittering sparkle cascade */
export function soundWheelWinShimmer() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  [2093, 2349, 2637, 3136, 3520].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.13 - i*0.02, 0.01, 0.4 - i*0.05, t + i*0.07);
  });
}

/** Lose — descending wah + bass thud */
export function soundWheelLoseDrop() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Descending wah
  playTone(ctx, 520, "sine", 0.22, 0.01, 0.4, t, 80);
  playTone(ctx, 380, "sine", 0.14, 0.01, 0.35, t + 0.12, 55);
  // Bass thud
  playTone(ctx, 55,  "sine", 0.65, 0.003, 0.35, t + 0.18, 6);
  playTone(ctx, 30,  "sine", 0.45, 0.003, 0.4,  t + 0.18, 4);
}

/* ─────────────────────────────────────────────────────────────
   TOWER GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Place Bet — deep power-up hum + rising electric sweep */
export function soundTowerBetStart() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 55,  "sine",     0.24, 0.05, 0.55, t, 200);
  playTone(ctx, 110, "sine",     0.12, 0.07, 0.45, t + 0.06, 280);
  playTone(ctx, 880, "triangle", 0.09, 0.01, 0.18, t + 0.22);
  playTone(ctx, 1320,"triangle", 0.06, 0.01, 0.14, t + 0.28);
}

/** Safe tile picked — crystal step chime, pitch climbs with row */
export function soundTowerStep(row: number, maxRow: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const progress = row / maxRow;
  const base = 440 + progress * 880; // 440Hz row-0 → 1320Hz row-top
  playTone(ctx, base,       "sine", 0.38, 0.005, 0.28, t);
  playTone(ctx, base * 1.5, "sine", 0.16, 0.008, 0.22, t + 0.02);
  playTone(ctx, base * 2,   "sine", 0.08, 0.01,  0.18, t + 0.04);
}

/** High row brass accent — fires on rows above halfway */
export function soundTowerHighStep(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = 330 + Math.min(mult, 20) * 8;
  playTone(ctx, base,       "sawtooth", 0.18, 0.008, 0.2, t);
  playTone(ctx, base * 1.5, "sawtooth", 0.10, 0.01,  0.16, t + 0.03);
}

/** Cashout click — coin cascade + triumph sting */
export function soundTowerCashoutStart() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  [880, 1047, 1175, 1319, 1568].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.28 - i * 0.04, 0.005, 0.25, t + i * 0.055);
  });
  playTone(ctx, 2093, "sine", 0.12, 0.01, 0.2, t + 0.32);
}

/** Win fanfare — 6-note ascending choir + deep bass */
export function soundTowerWinFanfare(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = mult >= 20 ? 587.33 : mult >= 10 ? 523.25 : 493.88;
  [base, base*1.25, base*1.5, base*2, base*2.5, base*3].forEach((freq, i) => {
    playTone(ctx, freq,       "sine", 0.44 - i*0.055, 0.01, 0.65, t + i*0.075);
    playTone(ctx, freq*1.003, "sine", 0.15 - i*0.02,  0.015, 0.55, t + i*0.075 + 0.012);
  });
  // Deep bass foundation
  playTone(ctx, base / 2, "sine", 0.35, 0.015, 0.7, t + 0.1);
  if (mult >= 10) playTone(ctx, base*4, "sine", 0.12, 0.01, 0.45, t + 0.52);
}

/** Win shimmer — crystal cascade when YOU WIN appears */
export function soundTowerWinShimmer() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  [2093, 2349, 2637, 3136].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.13 - i*0.025, 0.01, 0.4 - i*0.06, t + i*0.075);
  });
}

/** Bust — explosion boom + structural crumble rumble */
export function soundTowerBust() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Explosion punch
  playTone(ctx, 80,  "sine", 0.75, 0.003, 0.4,  t, 6);
  playTone(ctx, 40,  "sine", 0.55, 0.003, 0.55, t, 4);
  playTone(ctx, 140, "sine", 0.28, 0.003, 0.25, t + 0.05, 8);
  // Crumble: descending rumble
  playTone(ctx, 120, "sine", 0.2, 0.01, 0.6, t + 0.12, 25);
  playTone(ctx, 60,  "sine", 0.3, 0.01, 0.8, t + 0.18, 10);
  // Wide-band noise crumble
  const noise = noiseSource(ctx, 0.5);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.55, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t + 0.05); noise.stop(t + 1.2);
}

/* ─────────────────────────────────────────────────────────────
   KENO GAME SOUNDS
───────────────────────────────────────────────────────────── */

/** Draw begins — lottery machine whirr + air-puff whoosh */
export function soundKenoDraw() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Machine whirr
  playTone(ctx, 120, "sawtooth", 0.14, 0.05, 0.55, t, 280);
  playTone(ctx, 220, "sawtooth", 0.07, 0.07, 0.45, t + 0.04, 380);
  // Air puff whoosh
  const noise = noiseSource(ctx, 0.22);
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  noise.connect(bp); bp.connect(g); g.connect(ctx.destination);
  noise.start(t + 0.15); noise.stop(t + 0.6);
}

/** Each ball reveals — crystal ping (match) or soft thud (miss) */
export function soundKenoBall(isMatch: boolean, idx: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  if (isMatch) {
    // Crystal ping — pitch varies 600→1400Hz across draw order
    const freq = 600 + (idx / 20) * 800;
    playTone(ctx, freq,       "sine", 0.3,  0.003, 0.22, t);
    playTone(ctx, freq * 1.5, "sine", 0.12, 0.005, 0.18, t + 0.01);
    playTone(ctx, freq * 2,   "sine", 0.06, 0.008, 0.14, t + 0.02);
  } else {
    // Soft thud
    playTone(ctx, 160, "sine", 0.22, 0.003, 0.08, t, 12);
    playTone(ctx, 80,  "sine", 0.12, 0.003, 0.1,  t, 6);
  }
}

/** Final ball — dramatic suspense sting */
export function soundKenoLastBall() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Low drone build
  playTone(ctx, 55,  "sine", 0.22, 0.05, 0.55, t, 5);
  playTone(ctx, 110, "sine", 0.12, 0.08, 0.45, t + 0.05, 8);
  // Quick tension staccato
  playTone(ctx, 660, "triangle", 0.18, 0.005, 0.12, t + 0.3);
  playTone(ctx, 880, "triangle", 0.12, 0.005, 0.1,  t + 0.38);
}

/** ≥5 matches — ascending fanfare burst */
export function soundKenoHighMatch(count: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = 440 + count * 20;
  [base, base*1.25, base*1.5, base*2, base*2.5].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.32 - i*0.05, 0.008, 0.3, t + i*0.06);
  });
}

/** Win — 6-note choir fanfare scaling with multiplier */
export function soundKenoWinFanfare(mult: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const base = mult >= 10 ? 587.33 : mult >= 3 ? 523.25 : 493.88;
  [base, base*1.25, base*1.5, base*2, base*2.5, base*3].forEach((freq, i) => {
    playTone(ctx, freq,       "sine", 0.44 - i*0.055, 0.01,  0.65, t + i*0.075);
    playTone(ctx, freq*1.003, "sine", 0.15 - i*0.02,  0.015, 0.55, t + i*0.075 + 0.012);
  });
  playTone(ctx, base/2, "sine", 0.3, 0.015, 0.7, t + 0.1);
}

/** Win shimmer — crystal sparkle cascade */
export function soundKenoWinShimmer() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  [2093, 2349, 2637, 3136, 3520].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.13 - i*0.02, 0.01, 0.4 - i*0.05, t + i*0.07);
  });
}

/** Lose — descending wah + bass thud */
export function soundKenoLoseDrop() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 520, "sine", 0.22, 0.01, 0.4, t, 80);
  playTone(ctx, 380, "sine", 0.14, 0.01, 0.35, t + 0.12, 55);
  playTone(ctx, 55,  "sine", 0.6, 0.003, 0.35, t + 0.2, 6);
  playTone(ctx, 30,  "sine", 0.4, 0.003, 0.4,  t + 0.2, 4);
}

/* ─────────────────────────────────────────────────────────────
   VIDEO POKER SOUNDS
───────────────────────────────────────────────────────────── */

/** Deal button — cascading card shuffle riffle × 3 */
export function soundPokerShuffle() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const noise = noiseSource(ctx, 0.06);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
    bp.frequency.value = 2400 + i * 300; bp.Q.value = 2.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t + i * 0.11);
    g.gain.linearRampToValueAtTime(0.35, t + i * 0.11 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.16);
    noise.connect(bp); bp.connect(g); g.connect(ctx.destination);
    noise.start(t + i * 0.11); noise.stop(t + i * 0.11 + 0.18);
  }
}

/** Card lands on table — crisp snap, pitch varies by position */
export function soundPokerCardDeal(idx: number) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const freq = 1100 + idx * 60;
  const noise = noiseSource(ctx, 0.04);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  noise.connect(hp); hp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.1);
  playTone(ctx, freq / 2, "sine", 0.12, 0.003, 0.06, t);
}

/** Toggle hold — click (hold on) or pop (hold off) */
export function soundPokerHoldToggle(held: boolean) {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  if (held) {
    playTone(ctx, 880, "sine", 0.18, 0.003, 0.1, t);
    playTone(ctx, 1320, "sine", 0.09, 0.005, 0.08, t + 0.02);
  } else {
    playTone(ctx, 660, "sine", 0.14, 0.003, 0.08, t);
  }
}

/** Draw button — quick shuffle burst then card sequence */
export function soundPokerDraw() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const noise = noiseSource(ctx, 0.05);
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = 1.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  noise.connect(bp); bp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.2);
  playTone(ctx, 550, "sine", 0.1, 0.003, 0.12, t + 0.05);
}

/** Jacks or Better — gentle single chime ding */
export function soundPokerWinJacks() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 880, "sine", 0.32, 0.004, 0.5, t);
  playTone(ctx, 1320, "sine", 0.14, 0.006, 0.4, t + 0.015);
}

/** Two Pair → Three of Kind — ascending 3-note chord */
export function soundPokerWinMedium() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.34 - i * 0.06, 0.006, 0.5, t + i * 0.07);
    playTone(ctx, freq * 2, "sine", 0.1, 0.008, 0.4, t + i * 0.07 + 0.01);
  });
}

/** Full House → Four of Kind — brass fanfare */
export function soundPokerWinBig() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  [392, 493.88, 587.33, 783.99, 987.77].forEach((freq, i) => {
    playTone(ctx, freq, "sawtooth", 0.22 - i * 0.03, 0.007, 0.55, t + i * 0.075);
    playTone(ctx, freq, "sine", 0.18 - i * 0.025, 0.005, 0.65, t + i * 0.075);
  });
  playTone(ctx, 196, "sine", 0.28, 0.01, 0.7, t + 0.1);
}

/** Straight Flush / Royal Flush — epic cathedral chord + shimmer */
export function soundPokerWinRoyal() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Cathedral chords in two waves
  [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((freq, i) => {
    playTone(ctx, freq,       "sine", 0.42 - i * 0.05, 0.012, 0.9, t + i * 0.065);
    playTone(ctx, freq * 1.003, "sine", 0.14 - i * 0.015, 0.015, 0.8, t + i * 0.065 + 0.01);
  });
  playTone(ctx, 130.81, "sine", 0.38, 0.015, 1.0, t + 0.12);
  // Shimmer cascade at 1.5s
  [2093, 2637, 3136, 3520, 4186].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.14 - i * 0.02, 0.01, 0.5, t + 1.5 + i * 0.08);
  });
}

/** Losing hand — soft descending minor chord */
export function soundPokerLose() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  [493.88, 415.3, 349.23, 293.66].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.18 - i * 0.03, 0.01, 0.45, t + i * 0.09);
  });
  playTone(ctx, 73.42, "sine", 0.25, 0.01, 0.55, t + 0.2);
}

/* ─────────────────────────────────────────────────────────────
   DRAGON TIGER SOUNDS
─────────────────────────────────────────────────────────────── */

/** Bet placed — deep chip thud with a high transient click */
export function soundDTBetPlace() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Deep thud
  playTone(ctx, 90, "sine", 0.55, 0.003, 0.18, t, 35);
  // Crisp click transient
  const noise = noiseSource(ctx, 0.04);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.38, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  noise.connect(hp); hp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.07);
}

/** Card flip — soft papery whoosh as card turns face-up */
export function soundDTCardFlip() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const noise = noiseSource(ctx, 0.1);
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
  bp.frequency.setValueAtTime(800, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.08);
  bp.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.28, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  noise.connect(bp); bp.connect(g); g.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.14);
}

/** Card reveal — crystal-clear tap ring (triangle, fast decay) */
export function soundDTCardReveal() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  playTone(ctx, 1320, "triangle", 0.22, 0.003, 0.22, t, 900);
  playTone(ctx, 880,  "triangle", 0.10, 0.004, 0.18, t + 0.01);
}

/** Win — royal fanfare arpeggio (C-E-G-C', 4 sine notes) */
export function soundDTWin() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.38 - i * 0.04, 0.008, 0.6, t + i * 0.06);
    playTone(ctx, freq * 2, "sine", 0.08, 0.005, 0.35, t + i * 0.06 + 0.01);
  });
  // Sub bass warmth
  playTone(ctx, 130, "sine", 0.22, 0.01, 0.5, t + 0.08);
}

/** Big Win — extended triumphant cluster with shimmering harmonics */
export function soundDTBigWin() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Brass-like sawtooth chords
  [261.63, 329.63, 392, 523.25, 659.25].forEach((freq, i) => {
    playTone(ctx, freq, "sawtooth", 0.22 - i * 0.025, 0.01, 0.8, t + i * 0.055);
    playTone(ctx, freq, "sine",     0.18 - i * 0.02,  0.008, 1.0, t + i * 0.055);
  });
  // Shimmer cascade at 0.8s
  [2093, 2637, 3136, 4186].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.12 - i * 0.02, 0.008, 0.45, t + 0.8 + i * 0.07);
  });
  playTone(ctx, 98, "sine", 0.3, 0.012, 0.9, t + 0.1);
}

/** Lose — descending minor arpeggio with dark growl undertone */
export function soundDTLose() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Descending minor: C-Bb-Ab-F
  [523.25, 466.16, 415.3, 349.23].forEach((freq, i) => {
    playTone(ctx, freq, "sine", 0.2 - i * 0.03, 0.01, 0.45, t + i * 0.1);
  });
  // Low growl
  playTone(ctx, 65, "sawtooth", 0.18, 0.015, 0.55, t + 0.15, 40);
  // Noise rumble
  const noise = noiseSource(ctx, 0.4);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 180;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  noise.connect(lp); lp.connect(g); g.connect(ctx.destination);
  noise.start(t + 0.1); noise.stop(t + 0.55);
}

/** Tie — mysterious detuned bell chord (2 triangle waves + soft reverb sim) */
export function soundDTTie() {
  const ctx = getCtx(); if (!ctx) return; resumeCtx(ctx);
  const t = ctx.currentTime;
  // Detuned bell pair — mysterious / ethereal
  playTone(ctx, 740,   "triangle", 0.28, 0.005, 0.9, t);
  playTone(ctx, 743.5, "triangle", 0.22, 0.005, 0.9, t + 0.005); // slight detune
  playTone(ctx, 987.77,"triangle", 0.15, 0.007, 0.7, t + 0.12);
  playTone(ctx, 1174.66,"sine",    0.10, 0.005, 0.5, t + 0.25);
  // Sub shimmer for depth
  playTone(ctx, 185, "sine", 0.18, 0.01, 0.8, t + 0.05);
  // Reverb simulation — delayed copies with decay
  [0.18, 0.36, 0.54].forEach((delay, i) => {
    playTone(ctx, 740, "triangle", 0.08 - i * 0.02, 0.005, 0.6 - i * 0.1, t + delay);
  });
}

/* ─────────────────────────────────────────────────────────────
   HOOK — use in React components
───────────────────────────────────────────────────────────── */

export function useSoundEnabled(): { enabled: boolean; toggle: () => void } {
  const key = "agy_sound_enabled";
  const get = (): boolean => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(key);
    return v === null ? true : v === "true";
  };
  const enabled = get();
  const toggle = () => {
    const next = !get();
    localStorage.setItem(key, String(next));
    window.dispatchEvent(new Event("agy_sound_toggle"));
  };
  return { enabled, toggle };
}
