// End-to-end check in Chromium (WEBAPP_BASELINE §12-11, §12-14), without the real AI model or the CDN:
//   - ONNX Runtime Web comes from the npm package (ORT_DIR), routed in place of jsDelivr
//   - the model is the small fake (scripts/test/make-fake-model.py → scripts/fetch-model.mjs --from)
//   - the microphone is Chromium's fake device playing voice.wav (the melody an octave lower, 30 cents flat)
// Steps: load song.wav → separation → sing → results → key change → reload and open from this device
// offline → the Japanese page.
//
// Usage: node scripts/test/e2e.mjs <base url, e.g. http://localhost:8788> <audio dir> <onnxruntime-web dist dir> [shots dir]
// lamejs (the MP3 encoder) is read from LAME_FILE (env), default: node_modules/@breezystack/lamejs/dist/lamejs.js next to the ORT dir

import { createRequire } from "node:module";
// require() (not import) so a globally installed Playwright is found too
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [BASE, AUDIO, ORT_DIR, SHOTS] = process.argv.slice(2);
const APP = BASE + "/karaoketrainer/";
const ORT_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
const LAME_URL = "https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/dist/lamejs.js";
const LAME_FILE = process.env.LAME_FILE || join(ORT_DIR, "../../@breezystack/lamejs/dist/lamejs.js");
const fail = (msg) => { console.error("FAIL: " + msg); process.exitCode = 1; };
const ok = (msg) => console.log("ok   " + msg);

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-audio-capture=" + join(AUDIO, "voice.wav"), "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1280, height: 900 } });
// context.route also catches requests made by the Service Worker (page.route does not)
await context.route(ORT_URL + "**", (route) => {
  const file = join(ORT_DIR, route.request().url().slice(ORT_URL.length));
  if (!existsSync(file)) return route.fulfill({ status: 404 });
  route.fulfill({ status: 200, body: readFileSync(file), headers: { "content-type": file.endsWith(".wasm") ? "application/wasm" : "text/javascript", "access-control-allow-origin": "*", "cross-origin-resource-policy": "cross-origin" } });
});
await context.route(LAME_URL, (route) => route.fulfill({ status: 200, body: readFileSync(LAME_FILE), headers: { "content-type": "text/javascript", "access-control-allow-origin": "*", "cross-origin-resource-policy": "cross-origin" } }));
await context.route("https://static.cloudflareinsights.com/**", (route) => route.fulfill({ status: 200, body: "", headers: { "content-type": "text/javascript", "access-control-allow-origin": "*" } }));

const errors = [];
const page = await context.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
const external = [];
context.on("request", (r) => { const u = new URL(r.url()); if (!u.href.startsWith(BASE) && !u.href.startsWith(ORT_URL) && u.href !== LAME_URL && !u.href.startsWith("https://static.cloudflareinsights.com/") && u.protocol.startsWith("http")) external.push(u.href); });

await page.goto(APP);
await page.waitForSelector("#practice.ghost");
if (await page.evaluate(() => crossOriginIsolated)) ok("cross-origin isolated"); else fail("not cross-origin isolated");
if (SHOTS) await page.screenshot({ path: join(SHOTS, "1-start.png") });

// Load the song: separation with the fake model
const t0 = Date.now();
await page.setInputFiles("#fileInput", join(AUDIO, "song.wav"));
await page.waitForSelector("#practice:not(.ghost)", { timeout: 120000 });
ok("separated in " + ((Date.now() - t0) / 1000).toFixed(1) + " s; " + (await page.textContent("#backend")));
await page.waitForFunction(() => !document.querySelector("#recentSect").hidden, null, { timeout: 10000 });
ok("saved to the recent list: " + (await page.textContent("#recent")).trim());

// Sing for 9 seconds from the start
await page.click("#singBtn");
await page.waitForSelector("#phonesDlg[open]");
await page.check("#phonesAgain");
await page.click("#phonesOk");
await page.waitForFunction(() => document.querySelector("#singBtn").getAttribute("aria-pressed") === "true");
await page.waitForTimeout(9000);
if (SHOTS) await page.screenshot({ path: join(SHOTS, "2-singing.png") });
const oct = await page.textContent("#octSel option[value=auto]");
await page.click("#singBtn");
await page.waitForSelector("#results:not([hidden])");
const res = await page.evaluate(() => ({ match: document.querySelector("#resMatch").textContent, sung: document.querySelector("#resSung").textContent, bias: document.querySelector("#resBias").textContent, note: document.querySelector("#resNote").textContent, worst: document.querySelector("#worst").innerText }));
console.log("     results:", JSON.stringify(res), "octave:", oct);
if (/lower/.test(oct)) ok("octave detected as lower"); else fail("octave not detected as lower: " + oct);
if (parseInt(res.sung) >= 50) ok("sung share " + res.sung); else fail("sung share low: " + res.sung);
if (parseInt(res.match) >= 50) ok("on pitch " + res.match); else fail("on pitch low: " + res.match);
if (/−/.test(res.bias)) ok("flat bias seen: " + res.bias); else fail("expected a flat bias: " + res.bias);
if (SHOTS) await page.screenshot({ path: join(SHOTS, "3-results.png"), fullPage: true });

// Compare: plays with your recording
await page.click("#cmpPlay");
await page.waitForTimeout(800);
const mix = await page.evaluate(() => ({ mine: !document.querySelector("#mineVol").hidden, vocalMuted: document.querySelector("#vocalMute").getAttribute("aria-pressed") }));
if (mix.mine && mix.vocalMuted === "true") ok("review: my voice slider shown, original vocal muted"); else fail("review mix: " + JSON.stringify(mix));
await page.click("#vocalMute"); // the original vocal on: it goes into the MP3 too
await page.click("#playBtn");

// Save with the song (MP3): the personal-use dialog, then a file with an ID3 tag and MP3 frames
await page.click("#playBtn"); // pause
await page.click("#mp3Btn");
await page.waitForSelector("#useDlg[open]");
await page.click("#useCancel");
await page.waitForSelector("#useDlg", { state: "hidden" });
await page.click("#mp3Btn");
await page.waitForSelector("#useDlg[open]");
const what = await page.textContent("#useWhat");
const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click("#useOk")]);
const mp3 = readFileSync(await download.path());
const tagged = mp3.subarray(0, 3).toString() === "ID3";
const tagSize = (mp3[6] << 21) | (mp3[7] << 14) | (mp3[8] << 7) | mp3[9];
const frame = mp3[10 + tagSize] === 0xff && (mp3[11 + tagSize] & 0xe0) === 0xe0;
const comment = mp3.subarray(0, 10 + tagSize).toString("utf16le").includes("personal use");
if (/original vocal/.test(what)) ok("MP3 mix follows the mutes: " + what); else fail("MP3 mix without the original vocal: " + what);
if (tagged && frame && comment && mp3.length > 20000) ok(`MP3 saved: ${download.suggestedFilename()} (${(mp3.length / 1024).toFixed(0)} KB, ${what})`);
else fail(`MP3: tag ${tagged}, frame ${frame}, comment ${comment}, ${mp3.length} bytes`);
await page.click("#playBtn"); // play again

// Closing the results hides "My voice" and brings back the saved vocal mute (off)
await page.click("#resClose");
const closed = await page.evaluate(() => ({ mine: document.querySelector("#mineVol").hidden, vocalMuted: document.querySelector("#vocalMute").getAttribute("aria-pressed") }));
if (closed.mine && closed.vocalMuted === "false") ok("after the results: my voice hidden, vocal mute back"); else fail("after the results: " + JSON.stringify(closed));
await page.click("#singBtn"); await page.waitForTimeout(3000); await page.click("#singBtn");
await page.waitForSelector("#results:not([hidden])");
if ((await page.getAttribute("#vocalMute", "aria-pressed")) === "true") ok("next take: original vocal muted again"); else fail("next take: vocal not muted");

// Key change +2
await page.click("#keyUp");
await page.click("#keyUp");
await page.waitForFunction(() => document.querySelector("#keyBusy").hidden, null, { timeout: 60000 });
ok("key " + (await page.textContent("#keyVal")));

// Keep the recording, then reload offline and open from this device
await page.click("#keepBtn");
await page.waitForFunction(() => document.querySelector("#keepBtn").disabled);
await page.waitForTimeout(1500); // the Service Worker caches the app files
await page.reload();
await page.waitForSelector("#recent .open");
// A song saved before the melody line changed (no lineV): its line is found again when it is opened
const lineOf = () => page.evaluate(() => new Promise((res, rej) => {
  const r = indexedDB.open("karaoketrainer", 1);
  r.onsuccess = () => {
    const st = r.result.transaction("songs", "readwrite").objectStore("songs");
    const g = st.getAll();
    g.onsuccess = () => res(g.result.map((x) => ({ v: x.lineV, voiced: x.line.filter((y) => !isNaN(y)).length })));
    g.onerror = () => rej(g.error);
  };
}));
await page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open("karaoketrainer", 1);
  r.onsuccess = () => {
    const st = r.result.transaction("songs", "readwrite").objectStore("songs");
    st.getAll().onsuccess = (e) => { for (const x of e.target.result) { delete x.lineV; x.line = new Float32Array(x.line.length).fill(NaN); st.put(x); } st.transaction.oncomplete = res; };
  };
}));
await context.setOffline(true);
await page.reload();
await page.waitForSelector("#recent .open");
await page.click("#recent .open");
await page.waitForSelector("#practice:not(.ghost)");
await page.waitForSelector("#results:not([hidden])");
ok("opened offline from this device, with the kept recording");
await page.waitForTimeout(500);
const after = await lineOf();
if (after.every((x) => x.v === 3 && x.voiced > 100)) ok("old melody line found again offline: " + JSON.stringify(after));
else fail("old melody line not found again: " + JSON.stringify(after));
await page.click("#playBtn");
await page.waitForTimeout(2500);
const tNow = await page.textContent("#timeNow");
if (tNow !== "0:00") ok("plays offline (" + tNow + ")"); else fail("did not play offline");
await context.setOffline(false);

// Japanese page
const ja = await context.newPage();
ja.on("pageerror", (e) => errors.push("ja: " + e));
ja.on("console", (m) => { if (m.type() === "error") errors.push("ja: " + m.text()); });
await ja.goto(APP + "ja/");
await ja.waitForSelector("#recent .open");
const title = await ja.textContent("#introTitle");
if (/カラオケ/.test(title)) ok("ja page: " + title); else fail("ja page title: " + title);
await ja.click("#recent .open");
await ja.waitForSelector("#practice:not(.ghost)");
ok("ja page opens a saved song");
if (SHOTS) {
  await ja.setViewportSize({ width: 390, height: 844 });
  await ja.waitForTimeout(300);
  await ja.screenshot({ path: join(SHOTS, "4-ja-phone.png"), fullPage: true });
}
await ja.close();

if (external.length) fail("requests to other hosts: " + external.join(", ")); else ok("no requests to other hosts");
const realErrors = errors.filter((e) => !/Failed to load resource: net::ERR_INTERNET_DISCONNECTED/.test(e));
if (realErrors.length) fail("console errors:\n  " + realErrors.join("\n  ")); else ok("no console errors");
await browser.close();
