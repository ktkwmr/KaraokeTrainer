// Test audio made up for the tests (no copyrighted material):
//   song.wav   20 s: a "singer" (harmonic tone, 300 Hz – 3.4 kHz, the band the fake vocals model keeps)
//              over bass notes (below 300 Hz) and a hi-hat (above 3.4 kHz)
//   voice.wav  the same melody an octave lower, 30 cents flat, as a stand-in for your singing
//              (Chromium's fake microphone: --use-file-for-fake-audio-capture)
// Usage: node scripts/test/make-test-song.mjs <out dir>
import { writeFileSync } from "node:fs";
const out = process.argv[2] || ".";
const SR = 44100, BEAT = 0.5;
// [MIDI, beats]: starts after 1 s
export const MELODY = [[67, 2], [69, 2], [71, 2], [72, 2], [74, 3], [0, 1], [72, 2], [71, 2], [69, 2], [67, 4], [0, 2], [69, 2], [71, 2], [72, 4]];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function voice(buf, shift, cents, amp, harmonics) {
  let at = 1, phase = 0;
  for (const [m, b] of MELODY) {
    const d = b * BEAT;
    if (m) {
      const f = hz(m + shift + cents / 100);
      const s0 = Math.round(at * SR), s1 = Math.round((at + d * 0.9) * SR);
      for (let i = s0; i < s1 && i < buf.length; i++) {
        const tt = (i - s0) / SR, env = Math.min(1, tt / 0.03) * Math.min(1, (s1 - i) / SR / 0.05);
        phase += (2 * Math.PI * f) / SR;
        let v = 0;
        for (let h = 1; h <= harmonics; h++) if (h * f < 3300) v += Math.sin(h * phase) / h;
        buf[i] += v * env * amp;
      }
    }
    at += d;
  }
}
function wav(name, data) {
  const n = data.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  writeFileSync(out + "/" + name, b);
}
const song = new Float32Array(SR * 20);
voice(song, 0, 0, 0.25, 8);
let seed = 1;
for (let i = 0; i < song.length; i++) {
  const tt = i / SR;
  const bass = [43, 45, 48, 43][Math.floor(tt / 2) % 4];
  song[i] += Math.sin(2 * Math.PI * hz(bass) * tt) * 0.25;
  seed = (seed * 16807) % 2147483647;
  const h = tt % 0.25;
  // Hi-hat: noise high-passed by differencing a few times, so it stays above 3.4 kHz
  song[i] += ((seed / 2147483647 - 0.5) * Math.exp(-h * 40)) * 0.15;
}
wav("song.wav", song);
const v = new Float32Array(SR * 20);
voice(v, -12, -30, 0.5, 6);
wav("voice.wav", v);
console.log("wrote song.wav and voice.wav in " + out);
