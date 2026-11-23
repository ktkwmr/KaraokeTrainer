// AudioWorklet: plays the song's tracks in sync (0: vocals, 1: accompaniment, 2: your recording when you
// compare) with a gain each, and passes the microphone to the page with the song position it was heard at. Doing both in one node keeps the microphone and the song on the same clock:
// the only offset left is the device's output + input latency, which the page subtracts (calibration).
//
// Tracks are 16-bit PCM at 44.1 kHz ([Int16Array L, R], or [mono] for the recording). On a cross-origin
// isolated page they are SharedArrayBuffers shared with the page (no copy). If the device runs at another
// rate, they are resampled on the fly (linear interpolation).
//
// Tempo: the vocal and accompaniment may be time-stretched by the page (slower or faster, same pitch). The
// position stays in the song's own time (44.1 kHz samples of the original), so the melody line, the beats and
// your takes need no change: it moves by rate per sample, and the tracks are read at pos / rate. Your
// recording is stored at the same scale (it is played only at the tempo it was sung at).
//
// Messages from the page:
//   { type: "load", tracks, length, rate, keep? }   (length: the song's length in its own time; rate: the
//      tempo the tracks were stretched to, 1 = original; keep: same song, keep the position and play state)
//   { type: "play" } / { type: "pause" } / { type: "seek", pos }  (pos in 44.1 kHz samples)
//   { type: "gains", gains: [n] }
//   { type: "offsets", offsets: [n] }  (track samples a track is played later (+) or earlier (−); your recording's
//      position, nudged on the results)
//   { type: "mic", on }     (send microphone blocks to the page)
//   { type: "clicks", count, interval, start }  (calibration clicks, seconds; start: delay before the first)
// Messages to the page:
//   { type: "pos", pos, playing }  (song time; about 30 times a second)
//   { type: "ended" }
//   { type: "mic", data: Float32Array(BLOCK), pos, playing, frame }  (pos: song position at the block's first
//      sample, 44.1 kHz samples; frame: this context's frame count at that sample)
//   { type: "click", frame }  (when a calibration click starts)

const SRC_RATE = 44100;
const MAX = 4;
const BLOCK = 1024;

class Player extends AudioWorkletProcessor {
  constructor() {
    super();
    this.tracks = null;
    this.count = 0;
    this.length = 0;
    this.rate = 1;
    this.pos = 0;
    this.playing = false;
    this.step = SRC_RATE / sampleRate;
    this.target = new Float32Array(MAX).fill(1);
    this.cur = new Float32Array(MAX).fill(1);
    this.off = new Int32Array(MAX);
    this.frames = 0;
    this.reportAt = 0;
    this.mic = false;
    this.micBuf = new Float32Array(BLOCK);
    this.micFill = 0;
    this.micPos = 0;
    this.micFrame = 0;
    this.micPlaying = false;
    this.clicks = []; // frames at which clicks start
    this.clickLen = Math.round(sampleRate * 0.03);
    this.port.onmessage = (e) => this.onMessage(e.data);
  }

  onMessage(msg) {
    if (msg.type === "load") {
      this.tracks = msg.tracks;
      this.rate = msg.rate || 1;
      this.length = msg.tracks ? msg.length || Math.round(msg.tracks[0][0].length * this.rate) : 0;
      const before = this.count;
      this.count = msg.tracks ? Math.min(MAX, msg.tracks.length) : 0;
      for (let s = before; s < this.count; s++) this.cur[s] = this.target[s];
      if (!msg.keep || !msg.tracks) {
        this.pos = 0;
        this.playing = false;
      }
      this.pos = Math.min(this.pos, Math.max(0, this.length - 1));
      this.report();
    } else if (msg.type === "play") {
      if (this.tracks) {
        if (this.pos >= this.length - 1) this.pos = 0;
        this.playing = true;
        this.report();
      }
    } else if (msg.type === "pause") {
      this.playing = false;
      this.report();
    } else if (msg.type === "seek") {
      this.pos = Math.max(0, Math.min(Math.max(0, this.length - 1), msg.pos));
      this.report();
    } else if (msg.type === "gains") {
      for (let s = 0; s < MAX; s++) this.target[s] = msg.gains[s] == null ? 0 : msg.gains[s];
    } else if (msg.type === "offsets") {
      for (let s = 0; s < MAX; s++) this.off[s] = Math.round(msg.offsets[s] || 0);
    } else if (msg.type === "mic") {
      this.mic = !!msg.on;
      this.micFill = 0;
    } else if (msg.type === "clicks") {
      const first = this.frames + Math.round((msg.start || 0.5) * sampleRate);
      this.clicks = [];
      for (let i = 0; i < msg.count; i++) this.clicks.push(first + Math.round(i * msg.interval * sampleRate));
    }
  }

  report() {
    this.port.postMessage({ type: "pos", pos: this.pos, playing: this.playing });
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const outL = out[0];
    const outR = out[1] || out[0];
    const n = outL.length;
    const input = inputs[0] && inputs[0][0];
    const active = this.playing && this.tracks;
    if (active) {
      // Gains glide to their targets over a few blocks, so changes do not click
      for (let s = 0; s < this.count; s++) this.cur[s] += (this.target[s] - this.cur[s]) * 0.4;
    }
    const last = this.length - 1;
    let ended = false;
    for (let i = 0; i < n; i++) {
      // Microphone: collect blocks, each tagged with the song position of its first sample
      if (this.mic) {
        if (this.micFill === 0) { this.micPos = this.pos; this.micFrame = this.frames + i; this.micPlaying = !!active; }
        this.micBuf[this.micFill++] = input ? input[i] : 0;
        if (this.micFill === BLOCK) {
          this.port.postMessage({ type: "mic", data: this.micBuf.slice(), pos: this.micPos, playing: this.micPlaying, frame: this.micFrame });
          this.micFill = 0;
        }
      }
      let l = 0, r = 0;
      if (active && this.pos < last) {
        const x = this.pos / this.rate;
        const p = Math.floor(x);
        const f = x - p;
        for (let s = 0; s < this.count; s++) {
          const g = this.cur[s] / 32768;
          if (g === 0) continue;
          const L = this.tracks[s][0], R = this.tracks[s][1] || L;
          const q = p - this.off[s];
          if (q < 0 || q >= L.length - 1) continue;
          l += (L[q] + (L[q + 1] - L[q]) * f) * g;
          r += (R[q] + (R[q + 1] - R[q]) * f) * g;
        }
        this.pos += this.step * this.rate;
        if (this.pos >= last) { this.pos = last; ended = true; }
      }
      // Calibration clicks (a short 1 kHz beep)
      if (this.clicks.length) {
        const frame = this.frames + i;
        if (frame === this.clicks[0]) this.port.postMessage({ type: "click", frame });
        const d = frame - this.clicks[0];
        if (d >= 0 && d < this.clickLen) {
          const v = Math.sin((2 * Math.PI * 1000 * d) / sampleRate) * 0.5 * (1 - d / this.clickLen);
          l += v; r += v;
        } else if (d >= this.clickLen) this.clicks.shift();
      }
      outL[i] = l;
      if (outR !== outL) outR[i] = r;
    }
    this.frames += n;
    if (ended) {
      this.playing = false;
      this.report();
      this.port.postMessage({ type: "ended" });
    } else if (active && this.frames >= this.reportAt) {
      this.reportAt = this.frames + sampleRate / 30;
      this.report();
    }
    return true;
  }
}

registerProcessor("karaoke-player", Player);
