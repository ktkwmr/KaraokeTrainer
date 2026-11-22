// Reverb for your recording (the comparison in mixer.js and "Save with the song" in index.html).
// A Schroeder–Moorer reverb in the Freeverb layout (Jezar at Dreampoint, public domain): 8 damped comb filters
// in parallel and 4 allpass filters in series per side, the right side's delays a little longer for width.
// Before it: a 20 ms pre-delay and a gentle low cut (150 Hz), so the voice stays clear and the low end clean.
// Mono in, stereo out (wet only: the caller adds the dry voice).
//
// One file for both places: an AudioWorklet module cannot be imported by the page, so this sets
// globalThis.KaraokeReverb (mixer.js reads it; index.html adds this module to the worklet first) and also
// exports it (index.html imports it for the MP3).

const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]; // delays at 44.1 kHz
const ALLPASS = [556, 441, 341, 225];
const SPREAD = 23;
const FEEDBACK = 0.86; // decay (RT60 about 1.2 s)
const DAMP = 0.3; // high frequencies fade faster in the tail
const GAIN = 0.045; // at a wet level of 1, the reverb is about as loud as the dry voice

class Reverb {
  constructor(rate) {
    const k = rate / 44100;
    const buf = (n) => new Float32Array(Math.max(1, Math.round(n * k)));
    this.combL = COMBS.map((d) => buf(d));
    this.combR = COMBS.map((d) => buf(d + SPREAD));
    this.apL = ALLPASS.map((d) => buf(d));
    this.apR = ALLPASS.map((d) => buf(d + SPREAD));
    this.pre = buf(0.02 * 44100);
    this.storeL = new Float32Array(COMBS.length);
    this.storeR = new Float32Array(COMBS.length);
    this.ci = new Int32Array(COMBS.length * 2);
    this.ai = new Int32Array(ALLPASS.length * 2);
    this.pi = 0;
    this.hp = Math.exp((-2 * Math.PI * 150) / rate);
    this.hpX = 0;
    this.hpY = 0;
    this.l = 0;
    this.r = 0;
  }

  reset() {
    for (const b of [...this.combL, ...this.combR, ...this.apL, ...this.apR, this.pre]) b.fill(0);
    this.storeL.fill(0); this.storeR.fill(0);
    this.hpX = this.hpY = 0;
    this.l = this.r = 0;
  }

  // One sample in (any scale); the wet output is left in this.l / this.r
  process(x) {
    // Low cut (one-pole high-pass)
    const y = this.hp * (this.hpY + x - this.hpX);
    this.hpX = x; this.hpY = y;
    // Pre-delay
    const pre = this.pre, input = pre[this.pi] * GAIN;
    pre[this.pi] = y;
    if (++this.pi === pre.length) this.pi = 0;
    let l = 0, r = 0;
    const n = COMBS.length;
    for (let c = 0; c < n; c++) {
      const bl = this.combL[c], br = this.combR[c];
      let il = this.ci[c], ir = this.ci[n + c];
      const ol = bl[il], or = br[ir];
      this.storeL[c] = ol * (1 - DAMP) + this.storeL[c] * DAMP;
      this.storeR[c] = or * (1 - DAMP) + this.storeR[c] * DAMP;
      bl[il] = input + this.storeL[c] * FEEDBACK;
      br[ir] = input + this.storeR[c] * FEEDBACK;
      if (++il === bl.length) il = 0;
      if (++ir === br.length) ir = 0;
      this.ci[c] = il; this.ci[n + c] = ir;
      l += ol; r += or;
    }
    const m = ALLPASS.length;
    for (let a = 0; a < m; a++) {
      const bl = this.apL[a], br = this.apR[a];
      let il = this.ai[a], ir = this.ai[m + a];
      const ol = bl[il], or = br[ir];
      bl[il] = l + ol * 0.5;
      br[ir] = r + or * 0.5;
      l = ol - l; r = or - r;
      if (++il === bl.length) il = 0;
      if (++ir === br.length) ir = 0;
      this.ai[a] = il; this.ai[m + a] = ir;
    }
    this.l = l;
    this.r = r;
  }
}

globalThis.KaraokeReverb = Reverb;
export { Reverb };
