// Servidor estático que imita GitHub Pages: sirve dist/ bajo /panama-swim-demo/
// y responde 404.html (con estado 404) a las rutas que no existen como archivo.
// Uso: node scripts/serve-pages.mjs [puerto]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const base = process.env.BASE_PATH ?? "/panama-swim-demo/";
const root = "dist";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
  ".csv": "text/csv; charset=utf-8",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname === base.slice(0, -1)) {
    res.writeHead(301, { Location: base });
    return res.end();
  }
  if (!url.pathname.startsWith(base)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("404 (fuera de la ruta base)");
  }
  let rel = normalize(decodeURIComponent(url.pathname.slice(base.length))).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, rel);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  let status = 200;
  if (!existsSync(file)) {
    file = join(root, "404.html");
    status = 404;
  }
  res.writeHead(status, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`GitHub Pages simulado en http://localhost:${port}${base}`));
