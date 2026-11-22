// Signal processing shared by the workers: an FFT, and the STFT / mask / inverse STFT around the
// Spleeter 2stems model (separator.js).
//
// The Spleeter steps follow sherpa-onnx (Apache-2.0), offline-source-separation-spleeter-impl.h, with the
// STFT of kaldi-native-fbank (Apache-2.0) as configured there:
//   44.1 kHz, n_fft 4096, hop 1024, periodic Hann window, center = false
//   model input: the magnitude of the first 1024 bins, float32 [2 (channels), splits, 512 (frames), 1024]
//   model output (vocals.onnx / accompaniment.onnx): an estimated magnitude of the same shape
//   mask = est² / (vocals² + accompaniment² + 1e-10) (+ 1e-10 / 2 on top), multiplied with the complex STFT
//   inverse STFT: overlap-add of window × frame, divided by the summed squared window
// Differences from sherpa-onnx, on purpose:
//   - The song is processed one split (512 frames, about 11.9 s) at a time, so memory stays small on a
//     phone. Each split is independent in the model, so the result is the same.
//   - 3072 zeros are put before the song, so its first samples are covered by 4 frames like every other
//     sample (sherpa-onnx's first and last 3072 samples are covered by fewer frames).
//   - Left and right go through one complex FFT (left = real part, right = imaginary part).
//   - Bins 1024 and up (above 11 kHz) are not passed through the model. sherpa-onnx sets their mask to 0 for
//     both stems (cymbals and air disappear). Here the vocal mask there is the frame's average vocal mask
//     over 8–11 kHz (weighted by the input's magnitude) (like Spleeter's own mask_extension "average", but from the top of the band), smoothed
//     over 3 frames. With a fixed 0 (vocals) / 1 (accompaniment) there, the singer's "s" sounds and breaths above 11 kHz stayed in the
//     accompaniment as a scratchy hiss, and the vocals sounded dull.
//   - The vocal mask is smoothed (3 × 3 frames × bins, weighted by the input's magnitude) above 2 kHz, fully from 8 kHz up. The raw mask jumps
//     between frames in quiet high bins, which is heard as a scratchy "musical noise" in both stems.
//   - The accompaniment mask is 1 − the vocal mask (as in sherpa-onnx, where the two add up to 1), so vocals +
//     accompaniment is still the input.
// When the output changes, raise SEP_VERSION in index.html, so songs saved on the device are separated again
// when their file is chosen.

export function makeFft(n) {
  const bits = Math.round(Math.log2(n));
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let b = 0, x = i; b < bits; b++, x >>= 1) r = (r << 1) | (x & 1);
    rev[i] = r;
  }
  const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos((2 * Math.PI * i) / n); sin[i] = Math.sin((2 * Math.PI * i) / n); }
  // Forward transform in place (e^-i). The inverse: conjugate, transform, conjugate, divide by n.
  return function (re, im) {
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const l = j + half;
          const tr = re[l] * cos[k] + im[l] * sin[k];
          const ti = im[l] * cos[k] - re[l] * sin[k];
          re[l] = re[j] - tr; im[l] = im[j] - ti;
          re[j] += tr; im[j] += ti;
        }
      }
    }
  };
}

export const SPLEETER = { rate: 44100, nFft: 4096, hop: 1024, bins: 1024, frames: 512 };
const PAD = SPLEETER.nFft - SPLEETER.hop; // 3072 zeros before the song

// Number of 512-frame splits for a song of n samples
export function splitCount(n) {
  const frames = Math.floor((n - 1 + PAD) / SPLEETER.hop) + 1;
  return Math.max(1, Math.ceil(frames / SPLEETER.frames));
}

// left, right: Float32Array (44.1 kHz). Returns an object that runs the song split by split:
//   input(s)  → Float32Array [2, 1, 512, 1024]: the magnitudes of split s (the model's input)
//   output(s, vocals, accompaniment, outV, outA) → applies the masks from the two model outputs
//     ([2, 1, 512, 1024] each) and writes the finished samples into outV / outA ([Int16Array L, R])
// input(s) must be followed by output(s) before input(s + 1).
export function createSpleeter(left, right) {
  const { nFft: N, hop: H, bins: F, frames: T } = SPLEETER;
  const n = left.length;
  const B = N / 2 + 1;
  const fft = makeFft(N);
  const win = new Float64Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
  // Sum of the squared windows of the 4 frames that cover a sample (1.5 for a periodic Hann window at hop N / 4)
  const sumSq = new Float64Array(H);
  for (let i = 0; i < H; i++) { let s = 0; for (let k = 0; k < N / H; k++) s += win[i + k * H] * win[i + k * H]; sumSq[i] = s; }

  const re = new Float64Array(N), im = new Float64Array(N);
  // The complex spectra of the split's frames (left and right), kept for the masks
  const specL = { re: new Float32Array(T * B), im: new Float32Array(T * B) };
  const specR = { re: new Float32Array(T * B), im: new Float32Array(T * B) };
  const mag = new Float32Array(2 * T * F);
  // Overlap-add buffers (padded positions [base, base + T·H + N)) for vocals / accompaniment, left / right
  const OLA = T * H + N;
  const ola = [0, 1, 2, 3].map(() => new Float64Array(OLA));

  const sample = (x, j) => (j >= 0 && j < n ? x[j] : 0);

  function input(s) {
    const f0 = s * T;
    for (let t = 0; t < T; t++) {
      const start = (f0 + t) * H - PAD; // position in the song of the frame's first sample
      for (let i = 0; i < N; i++) {
        re[i] = sample(left, start + i) * win[i];
        im[i] = sample(right, start + i) * win[i];
      }
      fft(re, im);
      const o = t * B;
      for (let k = 0; k < B; k++) {
        const nk = (N - k) & (N - 1);
        const lr = (re[k] + re[nk]) / 2, li = (im[k] - im[nk]) / 2;
        const rr = (im[k] + im[nk]) / 2, ri = (re[nk] - re[k]) / 2;
        specL.re[o + k] = lr; specL.im[o + k] = li;
        specR.re[o + k] = rr; specR.im[o + k] = ri;
        if (k < F) {
          mag[t * F + k] = Math.sqrt(lr * lr + li * li);
          mag[T * F + t * F + k] = Math.sqrt(rr * rr + ri * ri);
        }
      }
    }
    return mag;
  }

  const toInt16 = (x) => {
    const v = x < -1 ? -1 : x > 1 ? 1 : x;
    return v < 0 ? Math.round(v * 32768) : Math.round(v * 32767);
  };

  // Smoothing of the vocal mask: weight of the 3 × 3 average per bin (0 below 2 kHz, 1 from 8 kHz)
  const binHz = SPLEETER.rate / N;
  const S0 = Math.round(2000 / binHz), S1 = Math.round(8000 / binHz);
  const smoothW = new Float32Array(F);
  for (let k = 0; k < F; k++) smoothW[k] = Math.max(0, Math.min(1, (k - S0) / (S1 - S0)));
  const raw = new Float32Array(2 * T * F); // raw vocal mask [channel, frame, bin]
  const mask = new Float32Array(2 * T * F); // smoothed vocal mask
  const ext = new Float32Array(2 * T); // vocal mask above 11 kHz [channel, frame]
  const extRaw = new Float32Array(2 * T);

  // Vocal masks of the split from the two model outputs (accompaniment = 1 − vocal). The averages are
  // weighted by the input's magnitude (mag, still that of this split), so silent bins (mask 0.5) and quiet
  // ones count little.
  function makeMasks(vocals, accompaniment) {
    for (let i = 0; i < 2 * T * F; i++) {
      const v = vocals[i], a = accompaniment[i];
      raw[i] = (v * v + 5e-11) / (v * v + a * a + 1e-10);
    }
    for (let c = 0; c < 2; c++) {
      const o = c * T * F;
      for (let t = 0; t < T; t++) {
        const t0 = t > 0 ? t - 1 : t, t1 = t < T - 1 ? t + 1 : t;
        for (let k = 0; k < F; k++) {
          const i = o + t * F + k, w = smoothW[k];
          if (w === 0) { mask[i] = raw[i]; continue; }
          const k0 = k > 0 ? k - 1 : k, k1 = k < F - 1 ? k + 1 : k;
          let sum = 0, wsum = 0;
          for (let tt = t0; tt <= t1; tt++) for (let kk = k0; kk <= k1; kk++) { const m = mag[o + tt * F + kk]; sum += raw[o + tt * F + kk] * m; wsum += m; }
          mask[i] = wsum > 0 ? raw[i] + (sum / wsum - raw[i]) * w : raw[i];
        }
        let e = 0, ew = 0, eu = 0;
        for (let k = S1; k < F; k++) { const m = mag[o + t * F + k], x = mask[o + t * F + k]; e += x * m; ew += m; eu += x; }
        extRaw[c * T + t] = ew > 0 ? e / ew : eu / (F - S1);
      }
      for (let t = 0; t < T; t++) {
        const t0 = t > 0 ? t - 1 : t, t1 = t < T - 1 ? t + 1 : t;
        let e = 0;
        for (let tt = t0; tt <= t1; tt++) e += extRaw[c * T + tt];
        ext[c * T + t] = e / (t1 - t0 + 1);
      }
    }
  }

  function output(s, vocals, accompaniment, outV, outA) {
    const f0 = s * T;
    makeMasks(vocals, accompaniment);
    for (let t = 0; t < T; t++) {
      // Masked spectra: Z = Y_left + i·Y_right, so one inverse FFT gives both channels
      // (vocals first, then the accompaniment)
      for (let stem = 0; stem < 2; stem++) {
        re.fill(0); im.fill(0);
        const o = t * B;
        const eL = ext[t], eR = ext[T + t];
        for (let k = 0; k < B; k++) {
          let mL, mR;
          if (k < F) {
            mL = mask[t * F + k];
            mR = mask[T * F + t * F + k];
          } else {
            mL = eL; mR = eR;
          }
          if (stem === 1) { mL = 1 - mL; mR = 1 - mR; }
          const ylr = specL.re[o + k] * mL, yli = k === 0 || k === N / 2 ? 0 : specL.im[o + k] * mL;
          const yrr = specR.re[o + k] * mR, yri = k === 0 || k === N / 2 ? 0 : specR.im[o + k] * mR;
          // Conjugated Z for the inverse transform through the forward FFT
          re[k] = ylr - yri; im[k] = -(yli + yrr);
          if (k !== 0 && k !== N / 2) { re[N - k] = ylr + yri; im[N - k] = yli - yrr; }
        }
        fft(re, im);
        const bufL = ola[stem * 2], bufR = ola[stem * 2 + 1];
        const at = t * H;
        for (let i = 0; i < N; i++) {
          bufL[at + i] += (re[i] / N) * win[i];
          bufR[at + i] -= (im[i] / N) * win[i];
        }
      }
    }
    // Padded positions before (f0 + T)·H are final: write them out (song position = padded − PAD)
    const base = f0 * H;
    for (let stem = 0; stem < 2; stem++) {
      const out = stem === 0 ? outV : outA;
      for (let c = 0; c < 2; c++) {
        const buf = ola[stem * 2 + c], dst = out[c];
        for (let i = 0; i < T * H; i++) {
          const j = base + i - PAD;
          if (j >= 0 && j < n) {
            // Every song sample is covered by 4 frames, so the squared windows add up to sumSq (1.5)
            dst[j] = toInt16(buf[i] / sumSq[(base + i) % H]);
          }
        }
        // Keep the part that the next split's first frames add to
        buf.copyWithin(0, T * H, OLA);
        buf.fill(0, OLA - T * H);
      }
    }
  }

  return { splits: splitCount(n), input, output };
}
