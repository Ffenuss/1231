// Procedural audio: music loop + SFX generated at runtime (no asset files).
// Web: WebAudio AudioContext graph.
// Native (Android/iOS): PCM buffers synthesised in JS and played through expo-audio.
import { Platform } from 'react-native';

let ctx = null;
let masterGain = null;
let musicGain = null;
let musicTimer = null;
let enabled = true;
let musicEnabled = true;
const currentScale = [0, 2, 4, 7, 9]; // pentatonic
let musicStep = 0;

// ---------------------------------------------------------------------------
// Native synthesis
// ---------------------------------------------------------------------------
const SAMPLE_RATE = 22050;
let nativePlayer = null;
let nativeReady = false;

function getNativePlayer() {
  if (Platform.OS === 'web' || nativeReady) return nativePlayer;
  nativeReady = true;
  try {
    // Lazy require so the web bundle never touches the native module.
    const { createAudioPlayer } = require('expo-audio');
    nativePlayer = createAudioPlayer(null, { updateInterval: 500 });
  } catch (e) {
    nativePlayer = null;
  }
  return nativePlayer;
}

function encodeWav(samples, sampleRate = SAMPLE_RATE) {
  const len = samples.length;
  const buffer = new ArrayBuffer(44 + len * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + len * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * 0x7fff, true);
  }
  return buffer;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  if (typeof global.btoa === 'function') return global.btoa(binary);
  return null;
}

// notes: [{ freq, dur, type, gain, delay }]
function synthNotes(notes) {
  const total = notes.reduce((a, n) => Math.max(a, n.delay + n.dur), 0) + 0.05;
  const len = Math.floor(total * SAMPLE_RATE);
  const out = new Float32Array(len);
  notes.forEach((n) => {
    const start = Math.floor(n.delay * SAMPLE_RATE);
    const dur = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < dur; i += 1) {
      const idx = start + i;
      if (idx >= len) break;
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, i / (SAMPLE_RATE * 0.008)) * Math.exp((-4 * t) / n.dur);
      const phase = 2 * Math.PI * n.freq * t;
      let wave;
      switch (n.type) {
        case 'square':
          wave = Math.sin(phase) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          wave = 2 * ((n.freq * t) % 1) - 1;
          break;
        case 'triangle':
          wave = 2 * Math.abs(2 * ((n.freq * t) % 1) - 1) - 1;
          break;
        default:
          wave = Math.sin(phase);
      }
      out[idx] += wave * env * (n.gain || 0.2);
    }
  });
  return out;
}

function playNative(notes) {
  const player = getNativePlayer();
  if (!player || !enabled) return;
  try {
    const samples = synthNotes(notes);
    const b64 = toBase64(encodeWav(samples));
    if (!b64) return;
    player.replace({ uri: `data:audio/wav;base64,${b64}` });
    player.volume = 0.9;
    player.play();
  } catch (e) {
    /* audio is a nice-to-have */
  }
}

// ---------------------------------------------------------------------------
// Web synthesis
// ---------------------------------------------------------------------------
function getCtx() {
  if (Platform.OS !== 'web') return null;
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(masterGain);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume();
  if (Platform.OS !== 'web') getNativePlayer();
}

export function setAudioEnabled(v) {
  enabled = v;
  if (masterGain) masterGain.gain.value = v ? 0.5 : 0;
}

export function setMusicEnabled(v) {
  musicEnabled = v;
  if (musicGain) musicGain.gain.value = v ? 0.16 : 0;
}

function tone(freq, dur, type = 'sine', gain = 0.2, when = 0, dest) {
  if (Platform.OS !== 'web') {
    playNative([{ freq, dur, type, gain, delay: when }]);
    return;
  }
  const c = getCtx();
  if (!c || !enabled) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(dest || masterGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function chord(notes) {
  if (Platform.OS !== 'web') {
    playNative(notes);
    return;
  }
  notes.forEach((n) => tone(n.freq, n.dur, n.type || 'sine', n.gain || 0.15, n.delay || 0));
}

function noise(dur = 0.15, gain = 0.15) {
  if (Platform.OS !== 'web') {
    // pseudo-noise: fast detuned cluster
    const notes = [];
    for (let i = 0; i < 6; i += 1) {
      notes.push({ freq: 180 + i * 70, dur: dur * 0.6, type: 'square', gain: gain * 0.5, delay: i * 0.012 });
    }
    playNative(notes);
    return;
  }
  const c = getCtx();
  if (!c || !enabled) return;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(masterGain);
  src.start();
}

export const sfx = {
  click() {
    tone(660, 0.06, 'triangle', 0.12);
  },
  dice() {
    noise(0.12, 0.2);
    tone(320, 0.08, 'square', 0.08, 0.02);
    tone(480, 0.08, 'square', 0.06, 0.08);
  },
  step() {
    tone(520, 0.05, 'sine', 0.06);
  },
  cash() {
    chord([
      { freq: 880, dur: 0.09, type: 'triangle', gain: 0.16 },
      { freq: 1320, dur: 0.12, type: 'triangle', gain: 0.12, delay: 0.07 },
    ]);
  },
  error() {
    tone(180, 0.18, 'sawtooth', 0.12);
  },
  win() {
    chord([523, 659, 784, 1046].map((f, i) => ({ freq: f, dur: 0.18, type: 'triangle', gain: 0.15, delay: i * 0.09 })));
  },
  lose() {
    chord([523, 440, 349, 262].map((f, i) => ({ freq: f, dur: 0.2, type: 'sawtooth', gain: 0.1, delay: i * 0.1 })));
  },
  levelUp() {
    chord([440, 554, 659, 880].map((f, i) => ({ freq: f, dur: 0.22, type: 'sine', gain: 0.16, delay: i * 0.08 })));
  },
  whoosh() {
    noise(0.25, 0.1);
  },
  slot() {
    chord(Array.from({ length: 5 }, (_, i) => ({ freq: 400 + i * 90, dur: 0.05, type: 'square', gain: 0.07, delay: i * 0.06 })));
  },
  footstep() {
    chord([
      { freq: 140, dur: 0.06, type: 'sine', gain: 0.05 },
      { freq: 96, dur: 0.05, type: 'triangle', gain: 0.04, delay: 0.03 },
    ]);
  },
  voice(pitch = 1) {
    // short "blah-blah" blip used for NPC chatter
    const base = 220 * pitch;
    chord([
      { freq: base, dur: 0.07, type: 'triangle', gain: 0.06 },
      { freq: base * 1.18, dur: 0.06, type: 'triangle', gain: 0.05, delay: 0.08 },
      { freq: base * 0.94, dur: 0.07, type: 'triangle', gain: 0.05, delay: 0.16 },
    ]);
  },
};

const MELODY = [0, 2, 4, 2, 0, -3, 0, 4];
const BASS = [-12, -12, -7, -7, -5, -5, -7, -7];
const ROOT = 261.63;

export function startMusic() {
  if (Platform.OS !== 'web') {
    // Native: schedule a short arpeggio loop, re-armed every bar.
    if (musicTimer || !musicEnabled) return;
    const playBar = () => {
      if (!musicEnabled) return;
      const notes = [];
      for (let i = 0; i < 8; i += 1) {
        const note = MELODY[(musicStep + i) % MELODY.length];
        notes.push({
          freq: ROOT * Math.pow(2, note / 12),
          dur: 0.34,
          type: 'triangle',
          gain: 0.09,
          delay: i * 0.42,
        });
        if (i % 2 === 0) {
          const bass = BASS[(musicStep + i) % BASS.length];
          notes.push({ freq: ROOT * Math.pow(2, bass / 12), dur: 0.5, type: 'sine', gain: 0.1, delay: i * 0.42 });
        }
      }
      musicStep += 8;
      playNative(notes);
    };
    playBar();
    musicTimer = setInterval(playBar, 3360);
    return;
  }
  const c = getCtx();
  if (!c || !musicEnabled || musicTimer) return;
  musicTimer = setInterval(() => {
    if (!musicEnabled) return;
    const note = MELODY[musicStep % MELODY.length];
    const bass = BASS[musicStep % BASS.length];
    const freq = ROOT * Math.pow(2, note / 12);
    tone(freq, 0.34, 'triangle', 0.09, 0, musicGain);
    if (musicStep % 2 === 0) {
      tone(ROOT * Math.pow(2, bass / 12), 0.5, 'sine', 0.12, 0, musicGain);
    }
    if (musicStep % 4 === 2) {
      tone(freq * 2, 0.18, 'sine', 0.04, 0.18, musicGain);
    }
    musicStep += 1;
  }, 420);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function audioAvailable() {
  return true;
}

export { currentScale };
