// The melody line of the separated vocals ("the original's pitch line"), and helpers shared with the page.
// Pitch detection: pitchy (McLeod Pitch Method, MIT), vendored in vendor/.
//
// extractLine(left, right) → Float32Array: one value per 10 ms (FPS), the pitch as a MIDI note number with
// a fraction (60 = C4, 60.5 = 50 cents above C4), or NaN where nobody is singing.
//   1. mono, halved to 22.05 kHz (a small low-pass first): the voice's fundamental is below 1.1 kHz
//   2. pitchy on 1024-sample windows (46 ms) every 10 ms
//   3. dropped: clarity below CLARITY, outside 65–1100 Hz, or quieter than the song's singing by 35 dB
//      (what the separation leaves in the vocals between phrases)
//   4. octave errors are moved back next to the notes around them (fixOctaves), then a median of 5 frames,
//      and voiced runs shorter than 70 ms are dropped

import { PitchDetector } from "./vendor/pitchy.js";

export const FPS = 100;
const RATE = 22050;
const WIN = 1024;
const HOP = RATE / FPS; // 220.5: frame k is centred on sample k·HOP
const CLARITY = 0.8;
const MIN_HZ = 65, MAX_HZ = 1100;

export const hzToMidi = (hz) => 69 + 12 * Math.log2(hz / 440);
export const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Stereo (Int16Array or Float32Array, 44.1 kHz) → mono Float32Array at 22.05 kHz
function toMono22k(left, right) {
  const scale = left instanceof Int16Array ? 1 / 32768 : 1;
  const n = Math.floor(left.length / 2);
  const out = new Float32Array(n);
  const at = (i) => (i < 0 || i >= left.length ? 0 : (left[i] + right[i]) * 0.5 * scale);
  // [1, 2, 1] / 4 then every second sample: enough of a low-pass for pitch detection
  for (let i = 0; i < n; i++) out[i] = (at(2 * i - 1) + 2 * at(2 * i) + at(2 * i + 1)) * 0.25;
  return out;
}

function median(arr) {
  const a = arr.slice().sort((x, y) => x - y);
  return a[a.length >> 1];
}

export function extractLine(left, right, progress) {
  const x = toMono22k(left, right);
  const frames = Math.ceil(x.length / HOP);
  const line = new Float32Array(frames).fill(NaN);
  const rms = new Float32Array(frames);
  const det = PitchDetector.forFloat32Array(WIN);
  det.minVolumeDecibels = -60;
  const buf = new Float32Array(WIN);
  let last = 0;
  for (let k = 0; k < frames; k++) {
    const start = Math.round(k * HOP) - WIN / 2;
    let e = 0;
    for (let i = 0; i < WIN; i++) {
      const j = start + i;
      const v = j >= 0 && j < x.length ? x[j] : 0;
      buf[i] = v;
      e += v * v;
    }
    rms[k] = Math.sqrt(e / WIN);
    if (rms[k] < 1e-4) continue;
    const [hz, clarity] = det.findPitch(buf, RATE);
    if (clarity >= CLARITY && hz >= MIN_HZ && hz <= MAX_HZ) line[k] = hzToMidi(hz);
    if (progress && k - last > 2000) { last = k; progress(k / frames); }
  }
  // Loudness gate relative to the singing (95th percentile of the voiced frames' level)
  const voicedRms = [];
  for (let k = 0; k < frames; k++) if (!isNaN(line[k])) voicedRms.push(rms[k]);
  if (voicedRms.length) {
    voicedRms.sort((a, b) => a - b);
    const ref = voicedRms[Math.floor(voicedRms.length * 0.95)];
    const gate = ref * Math.pow(10, -35 / 20);
    for (let k = 0; k < frames; k++) if (rms[k] < gate) line[k] = NaN;
  }
  fixOctaves(line);
  // Median of 5 within voiced runs
  const out = new Float32Array(frames).fill(NaN);
  for (let k = 0; k < frames; k++) {
    if (isNaN(line[k])) continue;
    const w = [];
    for (let j = k - 2; j <= k + 2; j++) if (j >= 0 && j < frames && !isNaN(line[j])) w.push(line[j]);
    out[k] = median(w);
  }
  // Short voiced runs (< 70 ms) are noise or consonants
  for (let k = 0; k < frames; ) {
    if (isNaN(out[k])) { k++; continue; }
    let e = k;
    while (e < frames && !isNaN(out[e])) e++;
    if (e - k < 7) out.fill(NaN, k, e);
    k = e;
  }
  return out;
}

// Octave errors: MPM sometimes takes a multiple of the period (−12, −19, −24 semitones: the separation
// leaves the voice's harmonics weak or the accompaniment's bass in) or half of it (+12), for a few frames
// or a few hundred ms in the middle of a note. A frame 9 semitones or more away from the median of the
// voiced frames within ±0.5 s of it (in the same phrase: gaps up to 0.1 s) is moved by the step that brings
// it nearest, if that brings it at least 6 semitones closer. Leaps that last longer than the window's half
// move the median with them and stay. Twice, so a run that was most of a window is checked again.
const OCT_WIN = 50, OCT_GAP = 10;
const OCT_STEPS = [12, 12 * Math.log2(3), 24, -12];
export function fixOctaves(line) {
  const n = line.length;
  for (let pass = 0; pass < 2; pass++) {
    const fixed = line.slice();
    for (let k = 0; k < n; ) {
      if (isNaN(line[k])) { k++; continue; }
      // a phrase: voiced frames with gaps of up to OCT_GAP frames
      let e = k + 1, gap = 0;
      while (e < n && gap <= OCT_GAP) { if (isNaN(line[e])) gap++; else gap = 0; e++; }
      e -= gap; // end after the last voiced frame
      const idx = [];
      for (let j = k; j < e; j++) if (!isNaN(line[j])) idx.push(j);
      let lo = 0, hi = 0;
      for (const j of idx) {
        while (idx[lo] < j - OCT_WIN) lo++;
        while (hi < idx.length && idx[hi] <= j + OCT_WIN) hi++;
        const w = [];
        for (let i = lo; i < hi; i++) w.push(line[idx[i]]);
        const ref = median(w), d = line[j] - ref;
        if (Math.abs(d) < 9) continue;
        let best = d;
        for (const s of OCT_STEPS) if (Math.abs(d + s) < Math.abs(best)) best = d + s;
        if (Math.abs(best) <= Math.abs(d) - 6) fixed[j] = ref + best;
      }
      k = e;
    }
    line.set(fixed);
  }
  return line;
}

// Melody range for the key suggestion: the 5th and 95th percentile of the voiced frames (so a moment of a
// stray note does not count). null when the song has almost no singing.
export function lineRange(line) {
  const v = [];
  for (let k = 0; k < line.length; k++) if (!isNaN(line[k])) v.push(line[k]);
  if (v.length < FPS) return null;
  v.sort((a, b) => a - b);
  return { low: v[Math.floor(v.length * 0.05)], high: v[Math.floor(v.length * 0.95)] };
}

// Best transposition for a vocal range { low, high } (MIDI): semitones in −6…+6, and an octave to sing in
// (−1: an octave below the original, 0, +1). The melody (moved) should fit inside the range; if it cannot,
// it sticks out as little as possible. Among equal fits, the one nearer the middle of the range, then the
// smaller change, then singing in the original octave. Returns { semis, octave, fits, over } or null.
export function suggestKey(melody, voice) {
  if (!melody || !voice || !(voice.high > voice.low)) return null;
  let best = null;
  for (let octave = -1; octave <= 1; octave++) {
    for (let semis = -6; semis <= 6; semis++) {
      const lo = melody.low + semis + 12 * octave, hi = melody.high + semis + 12 * octave;
      const over = Math.max(0, voice.low - lo) + Math.max(0, hi - voice.high);
      const centre = Math.abs((lo + hi) / 2 - (voice.low + voice.high) / 2);
      const score = over * 100 + centre * 0.25 + Math.abs(semis) * 0.5 + Math.abs(octave) * 0.3;
      if (!best || score < best.score) best = { semis, octave, over, fits: over < 0.5, score };
    }
  }
  return best;
}
