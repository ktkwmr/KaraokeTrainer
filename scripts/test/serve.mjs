// Local static server for tests: serves public/ with the headers in public/_headers (like Cloudflare does).
// Usage: node scripts/test/serve.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = fileURLToPath(new URL("../../public/", import.meta.url));
const port = Number(process.argv[2]) || 8788;
const headers = {};
for (const line of (await readFile(join(ROOT, "_headers"), "utf8")).split("\n")) {
  const m = line.match(/^\s+([\w-]+):\s*(.*)$/);
  if (m) headers[m[1]] = m[2];
}
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".md": "text/markdown; charset=utf-8", ".xml": "application/xml", ".wasm": "application/wasm" };
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  try {
    if ((await stat(file)).isDirectory()) {
      if (!p.endsWith("/")) { res.writeHead(301, { location: p + "/" }); res.end(); return; }
      file = join(file, "index.html");
    }
    const body = await readFile(file);
    res.writeHead(200, { ...headers, "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(body);
  } catch {
    let body = "Not found";
    try { body = await readFile(join(ROOT, "404.html")); } catch {}
    res.writeHead(404, { ...headers, "content-type": "text/html; charset=utf-8" });
    res.end(body);
  }
}).listen(port, () => console.log("http://localhost:" + port + "/karaoketrainer/"));
