// Values shared by the articles and the app, read from the app's own files so the articles never
// disagree with it (WEBAPP_BASELINE.md §10-8). The build stops if a value cannot be found.
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../../public/karaoketrainer/${file}`, import.meta.url), "utf8");
function num(src, re, file) {
  const m = src.match(re);
  if (!m) throw new Error(`scripts/pages/app.mjs: ${re} not found in ${file}`);
  return Number(m[1]);
}

const html = read("index.html");

// The download size shown before the model's manifest.json has been read (the real size replaces it in the app)
export const MODEL_MB = num(html, /let MODEL_MB = (\d+);/, "index.html");
const engine = html.match(/const ENGINE_MB = \{ cpu: (\d+), gpu: (\d+) \};/);
if (!engine) throw new Error("scripts/pages/app.mjs: ENGINE_MB not found in index.html");
export const ENGINE_MB = { cpu: Number(engine[1]), gpu: Number(engine[2]) };
export const MAX_MIN = num(html, /const MAX_SEC = (\d+) \* 60;/, "index.html");
export const KEEP_SONGS = num(html, /const KEEP_SONGS = (\d+);/, "index.html");
const strict = html.match(/const STRICT = \{ easy: \[(\d+), (\d+)\], normal: \[(\d+), (\d+)\], strict: \[(\d+), (\d+)\] \};/);
if (!strict) throw new Error("scripts/pages/app.mjs: STRICT not found in index.html");
export const STRICT = { easy: [+strict[1], +strict[2]], normal: [+strict[3], +strict[4]], strict: [+strict[5], +strict[6]] };

// The intro and the help in index.html write the model size as text: they must match MODEL_MB
for (const s of [`about ${MODEL_MB} MB`, `約${MODEL_MB}MB`]) {
  const n = html.split(s).length - 1;
  if (n < 2) throw new Error(`scripts/pages/app.mjs: "${s}" should appear in the intro and the help of index.html (MODEL_MB = ${MODEL_MB})`);
}
