#!/usr/bin/env node
// Screenshots for the guide (public/karaoketrainer/images/guide/<lang>-<name>.png), made from the app itself
// with the demo song (made up for the app, no AI model needed) and Chromium's fake microphone playing a
// made-up "singer": the demo melody an octave lower, with one phrase sung flat (WEBAPP_BASELINE.md §10-4, §10-8).
//
// Usage: node scripts/render-guide-images.mjs
// Needs Playwright (require("playwright")) and starts its own server for public/.
// Re-run it after changing the look of the practice screen.

import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUT = join(ROOT, "public/karaoketrainer/images/guide/");
const PORT = 8791;
const SR = 44100;

// ---------- The "singer" ----------
const html = readFileSync(join(ROOT, "public/karaoketrainer/index.html"), "utf8");
const bpm = Number(html.match(/const DEMO_BPM = (\d+);/)[1]);
const melody = JSON.parse(html.match(/const DEMO_MELODY = (\[[\s\S]*?\]);/)[1].replace(/\s+/g, ""));
const beat = 60 / bpm;
const voice = new Float32Array(Math.ceil(30 * SR));
let at = 4 * beat, phase = 0;
melody.forEach(([m, b], i) => {
  const dur = b * beat;
  if (m) {
    // An octave lower; notes 6 to 8 (the end of the 2nd bar and the 3rd bar) 110 cents flat, a late start on note 10
    const cents = i >= 6 && i <= 8 ? -110 : i === 1 ? 35 : -10;
    const late = i === 10 ? 0.12 : 0.03;
    const f = 440 * Math.pow(2, (m - 12 - 69 + cents / 100) / 12);
    const s0 = Math.round((at + late) * SR), s1 = Math.round((at + dur * 0.9) * SR);
    for (let k = s0; k < s1; k++) {
      const tt = (k - s0) / SR, env = Math.min(1, tt / 0.03) * Math.min(1, (s1 - k) / SR / 0.05);
      const vib = tt > 0.3 ? Math.sin(2 * Math.PI * 5 * tt) * 0.2 : 0;
      phase += (2 * Math.PI * f * Math.pow(2, vib / 12)) / SR;
      let v = 0;
      for (let h = 1; h <= 8; h++) v += Math.sin(h * phase) / h;
      voice[k] += v * env * 0.4;
    }
  }
  at += dur;
});
const tmp = mkdtempSync(join(tmpdir(), "kt-shots-"));
const wav = join(tmp, "voice.wav");
{
  const n = voice.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, voice[i])) * 32767), 44 + i * 2);
  writeFileSync(wav, b);
}

// ---------- Screenshots ----------
const server = spawn(process.execPath, [join(ROOT, "scripts/test/serve.mjs"), String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-audio-capture=" + wav, "--autoplay-policy=no-user-gesture-required"],
});
try {
  for (const lang of ["en", "ja"]) {
    const context = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    await context.route("https://static.cloudflareinsights.com/**", (r) => r.fulfill({ status: 200, body: "", headers: { "content-type": "text/javascript" } }));
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/karaoketrainer/${lang === "ja" ? "ja/" : ""}`);
    await page.click("#demoBtn");
    await page.waitForSelector("#practice:not(.ghost)", { timeout: 60000 });
    await page.click("#singBtn");
    await page.click("#phonesOk");
    // The flat phrase (about 6–8 s into the song) is on screen at about 9.5 s
    await page.waitForTimeout(9500);
    const panel = page.locator(".panel.out");
    const box = await panel.boundingBox();
    const row = await page.locator("#singBtn").boundingBox();
    await page.screenshot({ path: join(OUT, `${lang}-sing.png`), clip: { x: box.x, y: box.y, width: box.width, height: row.y + row.height + 14 - box.y } });
    await page.waitForTimeout(5000);
    await page.click("#singBtn");
    await page.waitForSelector("#results:not([hidden])");
    await page.locator("#results").screenshot({ path: join(OUT, `${lang}-results.png`) });
    console.log(lang, await page.textContent("#resMatch"), await page.textContent("#resSung"), await page.textContent("#resBias"), JSON.stringify(await page.innerText("#worst")));
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log("Wrote " + OUT);
