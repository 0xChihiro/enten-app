import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(scriptDirectory, "..");
const webDirectory = join(repositoryDirectory, "web");

const manifest = JSON.parse(await readFile(join(webDirectory, "manifest.webmanifest"), "utf8"));
const buildManifest = JSON.parse(await readFile(join(webDirectory, "build-manifest.json"), "utf8"));
if (manifest.name !== "Enten" || manifest.display !== "standalone" || manifest.scope !== "/") {
  throw new Error("The PWA manifest is missing Enten's required standalone configuration.");
}

for (const icon of manifest.icons || []) {
  if (!icon.src?.startsWith("/")) throw new Error(`Manifest icon must be root-relative: ${icon.src}`);
  await access(join(webDirectory, icon.src.slice(1)));
}

if (!buildManifest.assets?.includes("/app.js")) {
  throw new Error("The production build manifest does not include /app.js.");
}

for (const requiredBundle of [
  "/app-auction.js",
  "/app-launch.js",
  "/app-presale.js",
  "/app-swap.js",
  "/app-wallet.js",
  "/moss-runtime.js",
  "/viem-runtime.js"
]) {
  if (!buildManifest.assets.includes(requiredBundle)) throw new Error(`Missing split bundle: ${requiredBundle}`);
}

if (buildManifest.precache?.includes("/moss-runtime.js")) {
  throw new Error("The lazy MOSS runtime must not be precached.");
}

for (const asset of buildManifest.assets) {
  if (!asset.startsWith("/")) throw new Error(`Build asset must be root-relative: ${asset}`);
  await access(join(webDirectory, asset.slice(1)));
}

const productionJavaScript = await Promise.all(
  buildManifest.assets.filter((asset) => asset.endsWith(".js")).map((asset) => readFile(join(webDirectory, asset.slice(1)), "utf8"))
);
if (productionJavaScript.some((source) => source.includes("https://esm.sh"))) {
  throw new Error("The production bundle still contains an esm.sh runtime dependency.");
}

const pages = (await readdir(webDirectory))
  .filter((name) => name.endsWith(".html"))
  .sort();

if (pages.length === 0) throw new Error("No HTML pages found in the web application.");

for (const page of pages) {
  const html = await readFile(join(webDirectory, page), "utf8");
  if (!html.includes('rel="manifest"')) throw new Error(`${page} does not link the PWA manifest.`);
  if (!html.includes('src="./pwa.js"')) throw new Error(`${page} does not load the PWA bootstrap.`);
  if (!html.includes('href="./styles.css"')) throw new Error(`${page} does not load the shared stylesheet.`);
  if (!html.includes('href="./fonts/playfair-display-latin-wght-normal.woff2"')) {
    throw new Error(`${page} does not preload the display font.`);
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) throw new Error(`${page} still loads fonts from Google.`);
  if (!html.includes('rel="apple-touch-icon"')) throw new Error(`${page} has no iOS Home Screen icon.`);
}

for (const [page, marker] of Object.entries({
  "auction.html": "data-auction-page",
  "launch.html": "data-launch-page",
  "presale.html": "data-presale-page",
  "swap.html": "data-swap-page",
  "wallet.html": "data-wallet-page"
})) {
  const html = await readFile(join(webDirectory, page), "utf8");
  if (!html.includes(marker)) throw new Error(`${page} does not declare its split-app marker.`);
}

for (const requiredFile of [
  "pwa.js",
  "sw.js",
  "styles.css",
  "build-manifest.json",
  "icons/enten-192.png",
  "icons/enten-512.png",
  "icons/apple-touch-icon.png"
]) {
  await access(join(webDirectory, requiredFile));
}

const wrangler = await readFile(join(repositoryDirectory, "wrangler.toml"), "utf8");
if (!/^pages_build_output_dir\s*=\s*"\.\/web"\s*$/m.test(wrangler)) {
  throw new Error('Cloudflare Pages must publish only pages_build_output_dir = "./web".');
}
if (/^\[assets\]/m.test(wrangler)) {
  throw new Error('Cloudflare Pages should use pages_build_output_dir instead of [assets].directory.');
}

console.log(`Verified Enten PWA manifest, assets, Cloudflare Pages root, and ${pages.length} installable pages.`);
