// Minimal dependency-free HTTPS static server for local testing.
// The MOSS wallet SDK's cross-origin iframe bridge wants a secure context,
// so plain http.server isn't enough — this serves web/ over TLS.
//
// Usage:
//   node scripts/serve-https.mjs            (defaults below)
//   PORT=8443 CERT_DIR=/tmp/enten-tls node scripts/serve-https.mjs
//
// Cert generation (self-signed, one-time browser "proceed" warning):
//   mkdir -p /tmp/enten-tls && openssl req -x509 -newkey rsa:2048 -nodes \
//     -keyout /tmp/enten-tls/key.pem -out /tmp/enten-tls/cert.pem -days 365 \
//     -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
// For a warning-free cert, use mkcert instead and point CERT_DIR at its output.

import { createServer } from "node:https";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../web", import.meta.url)));
const PORT = Number(process.env.PORT || 8443);
const HOST = process.env.HOST || "127.0.0.1";
const CERT_DIR = process.env.CERT_DIR || "/tmp/enten-tls";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

const key = await readFile(join(CERT_DIR, "key.pem"));
const cert = await readFile(join(CERT_DIR, "cert.pem"));

createServer({ key, cert }, (req, res) => {
  // Strip query string and decode, then resolve safely under ROOT.
  let pathname = decodeURIComponent(req.url.split("?")[0]);
  if (pathname === "/") pathname = "/index.html";
  const filePath = normalize(join(ROOT, pathname));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  const target = existsSync(filePath) && !filePath.endsWith("/") ? filePath : join(filePath, "index.html");
  if (!existsSync(target)) {
    res.writeHead(404, { "content-type": "text/plain" }).end("404 Not Found: " + pathname);
    return;
  }

  res.writeHead(200, {
    "content-type": MIME[extname(target)] || "application/octet-stream",
    "cache-control": "no-cache"
  });
  createReadStream(target).pipe(res);
}).listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  https://localhost:${PORT}/wallet.html`);
  console.log(`  (self-signed cert — accept the browser warning once)`);
});
