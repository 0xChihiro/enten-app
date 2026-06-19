import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { relative, sep } from "node:path";
import { build } from "esbuild";
import { minify } from "terser";

await rm("web/assets", { recursive: true, force: true });
await rm("web/fonts", { recursive: true, force: true });
await mkdir("web/fonts", { recursive: true });

const pageKinds = ["auction", "launch", "presale", "swap", "wallet"];
await Promise.all([
  "web/app.js",
  "web/viem-runtime.js",
  "web/moss-runtime.js",
  ...pageKinds.map((page) => `web/app-${page}.js`)
].map((path) => rm(path, { force: true })));

const fontAssets = [
  ["@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "inter-latin-wght-normal.woff2"],
  ["@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2", "jetbrains-mono-latin-wght-normal.woff2"],
  ["@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2", "playfair-display-latin-wght-normal.woff2"],
  ["@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2", "playfair-display-latin-wght-italic.woff2"]
];

await Promise.all(fontAssets.map(async ([source, destination]) => {
  const sourceUrl = import.meta.resolve(source);
  await copyFile(new URL(sourceUrl), `web/fonts/${destination}`);
}));

const runtimeResult = await build({
  entryPoints: {
    "moss-runtime": "src/moss-runtime.js",
    "viem-runtime": "src/viem-runtime.js"
  },
  bundle: true,
  chunkNames: "assets/[name]-[hash]",
  format: "esm",
  legalComments: "none",
  metafile: true,
  minify: true,
  outdir: "web",
  splitting: true,
  target: ["es2020"]
});

const pageResults = await Promise.all(pageKinds.map((page) => build({
  entryPoints: ["src/app.js"],
  bundle: true,
  define: { __ENTEN_PAGE__: JSON.stringify(page) },
  external: ["./moss-runtime.js", "./viem-runtime.js"],
  format: "esm",
  legalComments: "none",
  metafile: true,
  minify: true,
  outfile: `web/app-${page}.js`,
  target: ["es2020"]
})));

await Promise.all(pageKinds.map(async (page) => {
  const path = `web/app-${page}.js`;
  const source = await readFile(path, "utf8");
  const result = await minify(source, {
    compress: { passes: 3 },
    format: { comments: false },
    mangle: true,
    module: true
  });
  if (!result.code) throw new Error(`Terser produced no output for ${page}.`);
  await writeFile(path, result.code);
}));

const loaderResult = await build({
  entryPoints: ["src/loader.js"],
  bundle: false,
  format: "esm",
  legalComments: "none",
  metafile: true,
  minify: true,
  outfile: "web/app.js",
  target: ["es2020"]
});

const outputFiles = [runtimeResult, loaderResult, ...pageResults]
  .flatMap((result) => Object.keys(result.metafile.outputs));
const assets = outputFiles
  .map((output) => `/${relative("web", output).split(sep).join("/")}`)
  .concat(fontAssets.map(([, destination]) => `/fonts/${destination}`))
  .sort();
// Page modules are prefetched after the initial window load so later navigation
// stays instant/offline-capable. MOSS remains genuinely lazy and is cached only
// after the user selects it.
const precache = assets.filter((asset) => asset !== "/moss-runtime.js");

await writeFile("web/build-manifest.json", `${JSON.stringify({ assets, precache }, null, 2)}\n`);
