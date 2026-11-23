// Beats (quarter notes) of a song, for the lines in the roll.
// detectBeats() is a copy of the one in Loop Trainer (ktkwmr/LoopTrainer, public/looptrainer/index.html, between
// "BEGIN analysis" and "END analysis"; same author, MIT). The only change: `scale`, so the 16-bit stems
// (Int16Array, scale 1 / 32768) can be read without making a float copy of the song. It also returns the harmony
// change and the low end per beat, which Loop Trainer uses to find where bars start; this app does not use them yet.
// Fix a bug in one copy → propose the same fix for the other.
// Keep BEAT_BIAS in sync with Loop Trainer (it was measured there with test signals of known tempo).

// The detected beats sit about 14 ms early (measured with test signals of known tempo); this moves them onto the beat
const BEAT_BIAS = 0.014;
// Tempo and beat positions from the decoded audio:
// onset strength (spectral flux of a 11 kHz mono copy) → tempo by autocorrelation, weighted toward 120 BPM
// → beats by dynamic programming (D. Ellis, "Beat Tracking by Dynamic Programming", 2007)
// → each beat moved to the nearest onset peak. Also returns per beat how much the harmony changes there
// (chroma of this beat vs the previous one) and how strong the low end (kick, bass) is.
// `pause()` is awaited now and then; it returns false to stop. null: no steady beat (or stopped).
export async function detectBeats(L, R, rate, pause, scale = 1) {
  const DS = Math.max(1, Math.round(rate / 11025)), fs = rate / DS, N = 512, HOP = 64, fps = fs / HOP;
  const len = Math.floor(L.length / DS), x = new Float32Array(len);
  for (let i = 0, o = 0; i < len; i++) {
    let s = 0;
    for (let j = 0; j < DS; j++, o++) s += R ? L[o] + R[o] : L[o];
    x[i] = scale * s / (R ? 2 * DS : DS);
  }
  const frames = len >= N ? Math.floor((len - N) / HOP) + 1 : 0;
  if (frames < fps * 4) return null;
  // Radix-2 FFT tables
  const win = new Float32Array(N), rev = new Uint16Array(N), cos = new Float32Array(N / 2), sin = new Float32Array(N / 2);
  for (let i = 0; i < N; i++) { win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); let r = 0; for (let b = 1, v = i; b < N; b <<= 1, v >>= 1) r = (r << 1) | (v & 1); rev[i] = r; }
  for (let i = 0; i < N / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / N); sin[i] = -Math.sin(2 * Math.PI * i / N); }
  const re = new Float32Array(N), im = new Float32Array(N), prev = new Float32Array(N / 2), env = new Float32Array(frames);
  // Pitch class of each bin from about 65 Hz to 2.1 kHz (−1 outside), and the bins up to about 200 Hz for the low end
  const pcOf = new Int8Array(N / 2).fill(-1), lowTop = Math.round(200 * N / fs);
  for (let k = 1; k < N / 2; k++) { const f = k * fs / N; if (f >= 65 && f <= 2100) pcOf[k] = ((Math.round(12 * Math.log2(f / 440)) % 12) + 12) % 12; }
  const chroma = new Float32Array(frames * 12), lowEnv = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    const o = f * HOP;
    for (let i = 0; i < N; i++) { re[rev[i]] = x[o + i] * win[i]; im[i] = 0; }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, step = N / size;
      for (let s = 0; s < N; s += size) {
        for (let k = 0; k < half; k++) {
          const a = s + k, b = a + half, c = cos[k * step], d = sin[k * step];
          const tr = re[b] * c - im[b] * d, ti = re[b] * d + im[b] * c;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
    let flux = 0, low = 0;
    for (let k = 1; k < N / 2; k++) {
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]), m = Math.log(1 + 100 * mag);
      if (m > prev[k]) { flux += m - prev[k]; if (k <= lowTop) low += m - prev[k]; }
      prev[k] = m;
      if (pcOf[k] >= 0) chroma[f * 12 + pcOf[k]] += mag;
    }
    env[f] = f ? flux : 0;
    lowEnv[f] = f ? low : 0;
    if (f % 3000 === 2999 && !(await pause())) return null;
  }
  // Almost no change at all (a steady tone, silence): no beat
  let mean = 0;
  for (let i = 0; i < frames; i++) mean += env[i];
  if (mean / frames < 1) return null;
  // Remove the slowly changing part (about 0.5 s) and normalize, so loud and quiet parts count alike
  const half = Math.round(fps * 0.25), onset = new Float32Array(frames);
  let acc = 0, sq = 0;
  for (let i = 0; i < Math.min(frames, half); i++) acc += env[i];
  for (let i = 0; i < frames; i++) {
    if (i + half < frames) acc += env[i + half];
    if (i - half - 1 >= 0) acc -= env[i - half - 1];
    const n = Math.min(frames - 1, i + half) - Math.max(0, i - half) + 1;
    onset[i] = Math.max(0, env[i] - acc / n);
    sq += onset[i] * onset[i];
  }
  const sd = Math.sqrt(sq / frames) || 1;
  for (let i = 0; i < frames; i++) onset[i] /= sd;
  if (!(await pause())) return null;
  // Tempo: autocorrelation between 40 and 240 BPM, weighted by a log-normal around 120 BPM
  const lagMin = Math.floor(fps * 60 / 240), lagMax = Math.min(frames - 1, Math.ceil(fps * 60 / 40));
  const score = new Float32Array(lagMax + 2);
  let bestLag = 0;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let s = 0;
    for (let i = 0; i + lag < frames; i++) s += onset[i] * onset[i + lag];
    s /= frames - lag;
    const bpm = 60 * fps / lag, l2 = Math.log2(bpm / 120);
    score[lag] = s * Math.exp(-0.5 * l2 * l2);
    if (!bestLag || score[lag] > score[bestLag]) bestLag = lag;
    if (lag % 32 === 0 && !(await pause())) return null;
  }
  if (!bestLag || score[bestLag] <= 0) return null;
  // How clearly the onsets repeat at that period, between 0 (noise) and 1. With test signals: steady beats 0.87 or more,
  // noise, pads, and notes at random times 0.26 or less
  const ac = (lag) => { let v = 0; for (let i = 0; i + lag < frames; i++) v += onset[i] * onset[i + lag]; return v / (frames - lag); };
  const acs = [];
  for (let lag = lagMin; lag <= lagMax; lag += 2) acs.push(ac(lag));
  acs.sort((p, q) => p - q);
  const base = acs[acs.length >> 1], zero = ac(0);
  if (zero <= base || (ac(bestLag) - base) / (zero - base) < 0.3) return null;
  let period = bestLag;
  if (bestLag > lagMin && bestLag < lagMax) {
    const a = score[bestLag - 1], b = score[bestLag], c = score[bestLag + 1], den = a - 2 * b + c;
    if (den < 0) period += 0.5 * (a - c) / den;
  }
  if (!(await pause())) return null;
  // Beats: each beat is an onset, and the gap to the previous beat stays close to the period
  const sigma = period / 32, kr = Math.ceil(sigma * 3), kern = [];
  for (let k = -kr; k <= kr; k++) kern.push(Math.exp(-0.5 * (k / sigma) * (k / sigma)));
  const local = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let k = -kr; k <= kr; k++) { const j = i + k; if (j >= 0 && j < frames) s += onset[j] * kern[k + kr]; }
    local[i] = s;
  }
  const TIGHT = 100, cum = new Float32Array(frames), back = new Int32Array(frames).fill(-1);
  const lo = Math.round(period * 2), hi = Math.round(period / 2);
  for (let t = 0; t < frames; t++) {
    let best = -Infinity, arg = -1;
    for (let p = Math.max(0, t - lo); p <= t - hi; p++) {
      const lr = Math.log((t - p) / period), v = cum[p] - TIGHT * lr * lr;
      if (v > best) { best = v; arg = p; }
    }
    cum[t] = local[t] + (arg >= 0 && best > 0 ? best : 0);
    back[t] = arg >= 0 && best > 0 ? arg : -1;
    if (t % 20000 === 19999 && !(await pause())) return null;
  }
  let end = Math.max(0, frames - Math.round(period));
  for (let t = end; t < frames; t++) if (cum[t] > cum[end]) end = t;
  const idx = [];
  for (let t = end; t >= 0; t = back[t]) idx.push(t);
  idx.reverse();
  // Drop beats in silence at the start and the end
  const strength = idx.map((i) => local[i]).sort((a, b) => a - b), med = strength[strength.length >> 1] || 0;
  while (idx.length && local[idx[0]] < med * 0.25) idx.shift();
  while (idx.length && local[idx[idx.length - 1]] < med * 0.25) idx.pop();
  if (idx.length < 4) return null;
  // Move each beat to the onset peak within ±20 ms (sub-frame by parabolic interpolation)
  const r = Math.max(1, Math.round(fps * 0.02));
  const beats = new Float64Array(idx.length);
  for (let n = 0; n < idx.length; n++) {
    let m = idx[n];
    for (let i = Math.max(1, idx[n] - r); i <= Math.min(frames - 2, idx[n] + r); i++) if (onset[i] > onset[m]) m = i;
    let fm = m;
    if (m > 0 && m < frames - 1) {
      const a = onset[m - 1], b = onset[m], c = onset[m + 1], den = a - 2 * b + c;
      if (den < 0) fm += 0.5 * (a - c) / den;
    }
    // The flux of frame f compares the windows starting at f-1 and f: the onset is near the start of the window's second half
    beats[n] = (fm * HOP + N * 0.5) / fs + BEAT_BIAS;
  }
  // Per beat: the low end at the beat, and how different the harmony of this beat is from the previous one
  const lowAt = new Float32Array(idx.length), change = new Float32Array(idx.length);
  let prevSeg = null;
  for (let n = 0; n < idx.length; n++) {
    for (let i = Math.max(0, idx[n] - r); i <= Math.min(frames - 1, idx[n] + r); i++) lowAt[n] = Math.max(lowAt[n], lowEnv[i]);
    const seg = new Float32Array(12), endF = n + 1 < idx.length ? idx[n + 1] : Math.min(frames, idx[n] + Math.round(period));
    for (let i = idx[n]; i < endF; i++) for (let c = 0; c < 12; c++) seg[c] += chroma[i * 12 + c];
    let norm = 0;
    for (let c = 0; c < 12; c++) norm += seg[c] * seg[c];
    norm = Math.sqrt(norm) || 1;
    for (let c = 0; c < 12; c++) seg[c] /= norm;
    if (prevSeg) { let dot = 0; for (let c = 0; c < 12; c++) dot += seg[c] * prevSeg[c]; change[n] = 1 - dot; }
    prevSeg = seg;
  }
  return { tempo: 60 * fps / period, beats: beats, strength: Float32Array.from(idx, (i) => local[i]), low: lowAt, change: change };
}


// The beats over the whole song (0 … duration seconds): the detected beats, continued before the first and after the
// last one at the median beat length of the 8 beats next to that end, so the lines also run through the intro and the
// ending, where the beat could not be heard. null when there are no beats.
export function beatGrid(beats, duration) {
  if (!beats || beats.length < 4) return null;
  const n = beats.length;
  const med = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
  const gaps = (i0, i1) => { const g = []; for (let i = Math.max(1, i0); i < Math.min(n, i1); i++) g.push(beats[i] - beats[i - 1]); return g; };
  const p0 = med(gaps(1, 9)), p1 = med(gaps(n - 8, n));
  if (!(p0 > 0.2 && p1 > 0.2)) return null;
  const out = [];
  for (let t = beats[0] - p0 * Math.ceil(beats[0] / p0 - 1e-6); t < beats[0] - p0 * 0.5; t += p0) if (t >= -1e-6) out.push(Math.max(0, t));
  for (let i = 0; i < n; i++) out.push(beats[i]);
  for (let t = beats[n - 1] + p1; t <= duration; t += p1) out.push(t);
  return Float64Array.from(out);
}
