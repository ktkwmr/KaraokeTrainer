// End-to-end check in Chromium (WEBAPP_BASELINE §12-11, §12-14), without the real AI model or the CDN:
//   - ONNX Runtime Web comes from the npm package (ORT_DIR), routed in place of jsDelivr
//   - the model is the small fake (scripts/test/make-fake-model.py → scripts/fetch-model.mjs --from)
//   - the microphone is Chromium's fake device playing voice.wav (the melody an octave lower, 30 cents flat)
// Steps: load song.wav → separation (and beats) → sing → results → key change → volume double click → tempo
// (a take at 90%) → reload and open from this device
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
await page.waitForFunction(() => /about \d+ MB/.test(document.querySelector("#modelState").textContent));
if (!(await page.isHidden("#modelBox"))) ok("no model yet: " + (await page.textContent("#modelState"))); else fail("model note hidden before the download");
if (SHOTS) await page.screenshot({ path: join(SHOTS, "1-start.png") });

// Load the song: separation with the fake model
const t0 = Date.now();
await page.setInputFiles("#fileInput", join(AUDIO, "song.wav"));
await page.waitForSelector("#practice:not(.ghost)", { timeout: 120000 });
ok("separated in " + ((Date.now() - t0) / 1000).toFixed(1) + " s; " + (await page.textContent("#backend")));
await page.waitForFunction(() => !document.querySelector("#recentSect").hidden, null, { timeout: 10000 });
ok("saved to the recent list: " + (await page.textContent("#recent")).trim());
// Beats of the accompaniment (beats.js): the test song's hi-hat and bass are at 120 BPM (a beat every 0.5 s)
const beatsOf = () => page.evaluate(() => new Promise((res, rej) => {
  const r = indexedDB.open("karaoketrainer");
  r.onsuccess = () => {
    const g = r.result.transaction("songs").objectStore("songs").getAll();
    g.onsuccess = () => res(g.result.map((x) => {
      const b = x.beats ? Array.from(x.beats) : [];
      const gaps = b.slice(1).map((v, i) => v - b[i]).sort((p, q) => p - q);
      return { v: x.beatsV, n: b.length, first: b[0], last: b[b.length - 1], gap: gaps[gaps.length >> 1] };
    }));
    g.onerror = () => rej(g.error);
  };
}));
const goodBeats = (x) => x.v === 1 && Math.abs(x.gap - 0.5) < 0.01 && x.first < 0.5 && x.last > 19.4 && x.n >= 38;
{
  const b = await beatsOf();
  if (b.length && b.every(goodBeats)) ok("beats saved with the song: " + JSON.stringify(b));
  else fail("beats not found: " + JSON.stringify(b));
}

// Sing for 9 seconds from the start
await page.click("#singBtn");
await page.waitForSelector("#phonesDlg[open]");
await page.check("#phonesAgain");
await page.click("#phonesOk");
await page.waitForFunction(() => document.querySelector("#singBtn").getAttribute("aria-pressed") === "true");
await page.waitForTimeout(9000);
if (SHOTS) await page.screenshot({ path: join(SHOTS, "2-singing.png") });
await page.click("#singBtn");
await page.waitForSelector("#results:not([hidden])");
// Your notes are found from the recording after you stop
await page.waitForFunction(() => document.querySelector("#resMatch").textContent !== "…", null, { timeout: 30000 });
// Your octave is found by itself (no menu): read from the take kept on this device
const oct = await page.evaluate(() => new Promise((res) => {
  const tryRead = () => {
    const r = indexedDB.open("karaoketrainer");
    r.onsuccess = () => { const g = r.result.transaction("takes").objectStore("takes").getAll(); g.onsuccess = () => { r.result.close(); if (g.result.length) res(g.result[0].take.singOct); else setTimeout(tryRead, 200); }; };
  };
  tryRead();
}));
const res = await page.evaluate(() => ({ match: document.querySelector("#resMatch").textContent, bias: document.querySelector("#resBias").textContent, note: document.querySelector("#resNote").textContent, worst: document.querySelector("#worst").innerText }));
console.log("     results:", JSON.stringify(res), "octave:", oct);
const noOctMenu = await page.evaluate(() => !document.querySelector("#octSel, #prevBtn"));
if (oct === -1 && noOctMenu) ok("octave detected as lower (no octave menu, no \"See the last take\")"); else fail("octave: " + JSON.stringify({ oct, noOctMenu }));
if (parseInt(res.match) >= 50) ok("on pitch " + res.match); else fail("on pitch low: " + res.match);
if (/−/.test(res.bias)) ok("flat bias seen: " + res.bias); else fail("expected a flat bias: " + res.bias);
if (SHOTS) await page.screenshot({ path: join(SHOTS, "3-results.png"), fullPage: true });

// Delay correction and "Measure the delay" are on the results (not in the settings): a change moves the take
// (the line drawn on the roll); back to the value it was sung with restores it and the score. (The score itself
// may not change: a note is judged by its median, and the test song's notes are longer than twice the slider's range.)
const setDelay = (v) => page.evaluate((v) => { const r = document.querySelector("#latency"); r.value = v; r.dispatchEvent(new Event("input")); }, v);
const rollPx = () => page.evaluate(() => document.querySelector("#roll").toDataURL());
const delay0 = Number(await page.inputValue("#latency"));
const px0 = await rollPx();
await setDelay(500);
const moved = await page.evaluate(() => ({ val: document.querySelector("#latencyVal").textContent, inSettings: !!document.querySelector("#setDlg #latency, #setDlg #calibBtn"), calibHere: !!document.querySelector("#results #calibBtn"), match: document.querySelector("#resMatch").textContent }));
const pxMoved = await rollPx();
await setDelay(delay0);
const back = await page.evaluate(() => document.querySelector("#resMatch").textContent);
const pxBack = await rollPx();
if (moved.val === "500 ms" && !moved.inSettings && moved.calibHere && pxMoved !== px0 && pxBack === px0 && back === res.match) ok(`delay correction on the results: ${delay0} → 500 ms: line moved (${moved.match}), back: ${back}`);
else fail("delay correction on the results: " + JSON.stringify({ delay0, moved, back, before: res.match, lineMoved: pxMoved !== px0, lineBack: pxBack === px0 }));

// Review: plays with your recording (no compare / WAV buttons); "Delete the recording" sits in the sing row
await page.click("#playBtn");
await page.waitForTimeout(800);
const mix = await page.evaluate(() => ({ mine: !document.querySelector("#mineVol").hidden, vocalMuted: document.querySelector("#vocalMute").getAttribute("aria-pressed"), gone: !document.querySelector("#cmpPlay, #wavBtn"), del: !document.querySelector("#delTakeBtn").hidden && !!document.querySelector("#delTakeBtn").closest(".row #singBtn ~ #delTakeBtn, .row") && document.querySelector("#delTakeBtn").parentElement === document.querySelector("#singBtn").parentElement }));
if (mix.mine && mix.vocalMuted === "true" && mix.gone && mix.del) ok("review: my voice slider shown, original vocal muted, no compare / WAV, delete next to Sing"); else fail("review mix: " + JSON.stringify(mix));
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
if (/^0:20 · vocal \+ accompaniment \+ your voice/.test(what)) ok("MP3: the whole song (0:20), mix follows the mutes: " + what); else fail("MP3 mix: " + what);
if (tagged && frame && comment && mp3.length > 20000) ok(`MP3 saved: ${download.suggestedFilename()} (${(mp3.length / 1024).toFixed(0)} KB, ${what})`);
else fail(`MP3: tag ${tagged}, frame ${frame}, comment ${comment}, ${mp3.length} bytes`);
await page.click("#playBtn"); // play again

// The results stay open (no Close button, so the recording can't be lost by accident) until the next take
const still = await page.evaluate(() => ({ open: !document.querySelector("#results").hidden, mine: !document.querySelector("#mineVol").hidden, close: !!document.querySelector("#resClose") }));
if (still.open && still.mine && !still.close) ok("results stay open with my voice, no Close button"); else fail("results: " + JSON.stringify(still));
await page.click("#singBtn"); await page.waitForTimeout(3000); await page.click("#singBtn");
await page.waitForSelector("#results:not([hidden])");
if ((await page.getAttribute("#vocalMute", "aria-pressed")) === "true") ok("next take: original vocal muted again"); else fail("next take: vocal not muted");

// Key change +2
await page.click("#keyUp");
await page.click("#keyUp");
await page.waitForFunction(() => document.querySelector("#keyBusy").hidden, null, { timeout: 60000 });
ok("key " + (await page.textContent("#keyVal")));
// In another key than the take: my voice is shifted to it too (a note while it is made), then saved with it;
// muted, the mix is saved without it
{
  await page.waitForFunction(() => document.querySelector("#cmpTempo").hidden && document.querySelector("#keyBusy").hidden, null, { timeout: 60000 });
  await page.click("#mp3Btn");
  await page.waitForSelector("#useDlg[open]");
  const w1 = await page.textContent("#useWhat");
  const [d1] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click("#useOk")]);
  await page.click("#mineMute");
  await page.click("#mp3Btn");
  await page.waitForSelector("#useDlg[open]");
  const w = await page.textContent("#useWhat");
  const [d] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click("#useOk")]);
  await page.click("#mineMute");
  if (/your voice/.test(w1) && /my-singing-personal-use\.mp3$/.test(d1.suggestedFilename()) && !/your voice/.test(w) && /mix-personal-use\.mp3$/.test(d.suggestedFilename())) ok(`key +2: my voice shifted and saved (${w1}); muted: ${d.suggestedFilename()} (${w})`);
  else fail("MP3 in another key: " + JSON.stringify({ w1, n1: d1.suggestedFilename(), w, name: d.suggestedFilename() }));
}

// Double tap (double click) on a volume slider: back to 100%
await page.evaluate(() => { const r = document.querySelector("#accVol"); r.value = 30; r.dispatchEvent(new Event("input")); });
await page.dblclick("#accVol");
{
  const v = await page.textContent("#accVal");
  if (v === "100%") ok("double click on the accompaniment slider: back to 100%"); else fail("double click on a slider: " + v);
}

// Tempo 90% (same key): the song moves at 0.9× in its own time; this take was sung at 100%, so my voice is
// stretched to 90% too (a note while it is prepared), and the MP3 is saved at 90%
const mp3Size = async () => {
  await page.click("#mp3Btn");
  await page.waitForSelector("#useDlg[open]");
  const [d] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click("#useOk")]);
  return readFileSync(await d.path()).length;
};
// (the take was sung in the original key: back to it, or the MP3 is refused)
await page.click("#keyDown");
await page.click("#keyDown");
await page.waitForFunction(() => document.querySelector("#keyBusy").hidden, null, { timeout: 60000 });
const len100 = await mp3Size();
// The tempo slider dragged from 100% to 90% in 1% steps: the stems (and my voice) are made once, after it stops
let started = 0;
page.on("worker", (w) => { if (/keyshift\.js/.test(w.url())) started++; });
await page.evaluate(async () => {
  const r = document.querySelector("#tempoRange");
  for (let v = 99; v >= 90; v--) { r.value = v; r.dispatchEvent(new Event("input")); await new Promise((f) => setTimeout(f, 40)); }
});
const busyNow = await page.evaluate(() => !document.querySelector("#keyBusy").hidden && document.querySelector("#keyBusy").closest(".tempo") !== null);
await page.waitForFunction(() => document.querySelector("#keyBusy").hidden, null, { timeout: 60000 });
if (busyNow && started === 3) ok("tempo slider 100 → 90% in 1% steps: made once (" + started + " workers: 2 stems + my voice), message in the tempo row");
else fail("tempo slider: " + JSON.stringify({ busyNow, started }));
{
  await page.waitForFunction(() => document.querySelector("#cmpTempo").hidden, null, { timeout: 60000 });
  const st = await page.evaluate(() => document.querySelector("#tempoVal").textContent);
  if (st === "90%") ok("tempo " + st + ", my voice stretched to it"); else fail("tempo: " + st);
  // The same take at 90% is about 1 / 0.9 as long as at 100%
  const len90 = await mp3Size();
  const ratio = len90 / len100;
  if (ratio > 1.06 && ratio < 1.16) ok(`MP3 at 90%: ${ratio.toFixed(3)}× the length at 100%`); else fail(`MP3 at 90%: ${len90} bytes, at 100% ${len100}`);
  await page.evaluate(() => { const r = document.querySelector("#seek"); r.value = 0; r.dispatchEvent(new Event("change")); });
  const t0 = await page.evaluate(() => document.querySelector("#timeNow").textContent);
  const p0 = await page.evaluate(() => Number(document.querySelector("#seek").value));
  if (!(await page.evaluate(() => document.querySelector("#playBtn").title === "Pause"))) await page.click("#playBtn");
  const w0 = Date.now();
  await page.waitForTimeout(3000);
  const p1 = await page.evaluate(() => Number(document.querySelector("#seek").value));
  const speed = (p1 - p0) / ((Date.now() - w0) / 1000);
  if (speed > 0.8 && speed < 0.97) ok(`playback at ${speed.toFixed(2)}× of the song (${t0} →)`); else fail("tempo playback speed " + speed);
  // A take at 90%: kept with its tempo, its recording at that scale
  await page.click("#singBtn");
  await page.waitForTimeout(3000);
  const dis = await page.evaluate(() => document.querySelector("#tempoUp").disabled && document.querySelector("#tempoDown").disabled);
  await page.click("#singBtn");
  await page.waitForSelector("#results:not([hidden])");
  const after = await page.evaluate(() => ({ note: !document.querySelector("#cmpTempo").hidden, match: document.querySelector("#resMatch").textContent, up: document.querySelector("#tempoUp").disabled }));
  // (the fake voice plays at its own speed, not with the song at 90%, so the score itself means nothing here)
  if (dis && !after.note && !after.up) ok(`take at 90%: tempo locked while singing, my voice plays (${after.match})`); else fail("take at 90%: " + JSON.stringify({ dis, after }));
  await page.waitForFunction(() => new Promise((res) => {
    const r = indexedDB.open("karaoketrainer");
    r.onsuccess = () => { const g = r.result.transaction("takes").objectStore("takes").getAll(); g.onsuccess = () => { r.result.close(); res(g.result.some((x) => x.take.tempo === 90)); }; };
  }), null, { timeout: 10000 }).then(() => ok("take kept with tempo 90"), () => fail("take not kept with its tempo"));
  // − / + move 5% at a time; the double tap on the slider goes back to 100%
  await page.click("#tempoUp");
  const v95 = await page.textContent("#tempoVal");
  await page.click("#tempoUp");
  await page.waitForFunction(() => document.querySelector("#keyBusy").hidden, null, { timeout: 60000 });
  await page.click("#tempoDown");
  await page.dblclick("#tempoRange");
  await page.waitForFunction(() => document.querySelector("#keyBusy").hidden, null, { timeout: 60000 });
  const v100 = await page.evaluate(() => document.querySelector("#tempoVal").textContent + " " + document.querySelector("#tempoRange").value);
  if (v95 === "95%" && v100 === "100% 100") ok("tempo + is 5%; double click on the tempo slider: back to 100%"); else fail("tempo buttons / double click: " + JSON.stringify({ v95, v100 }));
  // Back at 100%: the take sung at 90% is stretched to it
  await page.waitForFunction(() => document.querySelector("#cmpTempo").hidden, null, { timeout: 60000 });
  const len90take = await mp3Size();
  if (len90take > 10000) ok("take sung at 90%, saved at 100%: " + (len90take / 1024).toFixed(0) + " KB"); else fail("MP3 of the 90% take at 100%: " + len90take);
}

// The last take is kept by itself (no button); reload offline and open from this device
const takesIn = () => page.evaluate(() => new Promise((res, rej) => {
  const r = indexedDB.open("karaoketrainer");
  r.onsuccess = () => {
    const d = r.result;
    const g = d.transaction("takes").objectStore("takes").getAll();
    g.onsuccess = () => { const out = g.result.map((x) => ({ audio: x.take.audio.length, v: x.take.v })); d.close(); res(out); };
    g.onerror = () => rej(g.error);
  };
  r.onerror = () => rej(r.error);
}));
await page.waitForFunction(() => /last take kept/.test(document.querySelector("#recent").innerText), null, { timeout: 10000 });
{
  const k = await takesIn();
  const keep = await page.evaluate(() => ({ btn: !!document.querySelector("#keepBtn"), del: !document.querySelector("#delTakeBtn").hidden, note: !document.querySelector("#keptNote") }));
  if (k.length === 1 && k[0].audio > 0 && k[0].v === 3 && !keep.btn && keep.del && keep.note) ok("last take kept by itself in \"takes\" (no Keep button, no note about it)");
  else fail("last take not kept: " + JSON.stringify({ k, keep }));
}
await page.waitForTimeout(1500); // the Service Worker caches the app files
await page.reload();
await page.waitForSelector("#recent .open");
// A take kept by version 1 (inside the song record, version 1 database layout): moved to "takes" when the song opens
await page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open("karaoketrainer");
  r.onsuccess = () => {
    const d = r.result;
    const tx = d.transaction(["songs", "takes"], "readwrite");
    tx.objectStore("takes").getAll().onsuccess = (e) => {
      for (const x of e.target.result) {
        tx.objectStore("songs").get(x.hash).onsuccess = (g) => { const rec = g.target.result; rec.take = x.take; tx.objectStore("songs").put(rec); };
        tx.objectStore("takes").delete(x.hash);
      }
    };
    tx.oncomplete = () => { d.close(); res(); };
  };
}));
// A song saved before the melody line changed (no lineV) and before the beats (no beatsV): its line is found again when
// it is opened, its beats right after
const lineOf = () => page.evaluate(() => new Promise((res, rej) => {
  const r = indexedDB.open("karaoketrainer");
  r.onsuccess = () => {
    const st = r.result.transaction("songs", "readwrite").objectStore("songs");
    const g = st.getAll();
    g.onsuccess = () => { r.result.close(); res(g.result.map((x) => ({ v: x.lineV, voiced: x.line.filter((y) => !isNaN(y)).length, take: !!x.take }))); };
    g.onerror = () => rej(g.error);
  };
}));
await page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open("karaoketrainer");
  r.onsuccess = () => {
    const st = r.result.transaction("songs", "readwrite").objectStore("songs");
    st.getAll().onsuccess = (e) => { for (const x of e.target.result) { delete x.lineV; delete x.beatsV; delete x.beats; x.line = new Float32Array(x.line.length).fill(NaN); st.put(x); } st.transaction.oncomplete = () => { r.result.close(); res(); }; };
  };
}));
await context.setOffline(true);
await page.reload();
await page.waitForSelector("#recent .open");
await page.click("#recent .open");
await page.waitForSelector("#practice:not(.ghost)");
// The last take opens with the song
await page.waitForSelector("#results:not([hidden])");
await page.waitForFunction(() => document.querySelector("#resMatch").textContent !== "…", null, { timeout: 30000 });
ok("opened offline from this device with its last take: " + (await page.textContent("#resMatch")));
await page.waitForTimeout(500);
const after = await lineOf();
if (after.every((x) => x.v === 3 && x.voiced > 100)) ok("old melody line found again offline: " + JSON.stringify(after));
else fail("old melody line not found again: " + JSON.stringify(after));
{
  const k = await takesIn();
  if (k.length === 1 && after.every((x) => !x.take)) ok("version 1 take moved from the song to \"takes\"");
  else fail("version 1 take not moved: " + JSON.stringify({ k, after }));
}
// A song saved before the beats: they are found in the background after it opened, and saved
await page.waitForTimeout(1500);
{
  const b = await beatsOf();
  if (b.length && b.every(goodBeats)) ok("beats of a song saved before them found offline: " + JSON.stringify(b));
  else fail("beats of an old song not found again: " + JSON.stringify(b));
}
await page.click("#playBtn");
await page.waitForTimeout(2500);
const tNow = await page.textContent("#timeNow");
if (tNow !== "0:00") ok("plays offline (" + tNow + ")"); else fail("did not play offline");
// Delete the recording: asks first, then the take is gone from the screen and this device; the song stays
await page.click("#delTakeBtn");
await page.waitForSelector("#confirmDlg[open]");
await page.click("#confirmOk");
await page.waitForSelector("#results", { state: "hidden" });
{
  const k = await takesIn();
  const st = await page.evaluate(() => ({ prev: false, mine: !document.querySelector("#mineVol").hidden, recent: document.querySelector("#recent").innerText }));
  const delGone = await page.evaluate(() => document.querySelector("#delTakeBtn").hidden);
  if (!k.length && !st.prev && !st.mine && delGone && !/last take kept/.test(st.recent) && /\S/.test(st.recent)) ok("Delete the recording: take deleted, the song stays");
  else fail("Delete the recording: " + JSON.stringify({ k, st, delGone }));
}
await context.setOffline(false);

// Japanese page
const ja = await context.newPage();
ja.on("pageerror", (e) => errors.push("ja: " + e));
ja.on("console", (m) => { if (m.type() === "error") errors.push("ja: " + m.text()); });
await ja.goto(APP + "ja/");
await ja.waitForSelector("#recent .open");
await ja.waitForSelector("#modelBox", { state: "hidden" }).then(() => ok("model on this device: no model note"), () => fail("model note shown with the model on this device"));
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
