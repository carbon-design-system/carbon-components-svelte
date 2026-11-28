/**
 * Builds the site into `dist/` with Bun.
 *
 * - svelte-bun compiles the components, and the `.md` pages that
 *   `scripts/svelte.ts` lists in `extensions`.
 * - bun-plugin-page adds each route's `modulepreload`s to the page, and
 *   minifies it. The router imports each page lazily, so without them a
 *   cold load of a deep link waits on the entry, then `App`, then the
 *   page's chunk, then its imports.
 * - The library's theme sheets ship as `build:css` wrote them, in one
 *   file linked ahead of the bundle's. They're minified already, and
 *   Bun's CSS minifier would merge their selectors into `:is()` and then
 *   lower each one to a `:-webkit-any()` copy, adding 240 kB.
 * - `public/` is copied as is, as the site's root.
 */
import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";
import type { BunPlugin } from "bun";
import { page } from "bun-plugin-page";
import { svelte } from "svelte-bun";
import { buildRoutes, FRAMED_PREFIX } from "../src/routes.ts";
import {
  carbonAlias,
  componentApi,
  componentMdSizes,
  framedStart,
  importMetaGlob,
} from "./bun-plugins.ts";
import {
  copyPlexFonts,
  PLEX_URL,
  rewritePlexUrls,
  selfHostPlex,
} from "./self-host-plex.ts";
import { siteModule } from "./site-module.ts";
import { options } from "./svelte.ts";

const DOCS = path.resolve(import.meta.dirname, "..");
const PAGES = path.join(DOCS, "src/pages");
const OUTDIR = path.join(DOCS, "dist");
const NODE_MODULES = path.join(DOCS, "node_modules");
const CARBON_CSS = path.resolve(DOCS, "../css");
/** The theme sheets `src/index.ts` imports, in its order. */
const CARBON_SHEETS = [
  "all.css",
  "prose.css",
  "syntax-tokens.css",
  "syntax.css",
].map((file) => path.join(CARBON_CSS, file));

/** Leaves the theme sheets out of the bundle: the build links them. */
const carbonSheets: BunPlugin = {
  name: "carbon-sheets",
  setup(build) {
    build.onLoad({ filter: /[\\/]css[\\/][^\\/]+\.css$/ }, (args) => {
      if (path.dirname(args.path) !== CARBON_CSS) return undefined;
      if (!CARBON_SHEETS.includes(args.path)) {
        throw new Error(
          `${path.basename(args.path)}: add it to CARBON_SHEETS, in the order src/index.ts imports it`,
        );
      }
      return { contents: "", loader: "css" };
    });
  },
};

/** Writes the theme sheets as one hashed file, and links it first. */
function linkCarbonSheets(indexFile: string) {
  const css = CARBON_SHEETS.map((file) =>
    rewritePlexUrls(
      fs.readFileSync(file, "utf8"),
      (family) => `${PLEX_URL}/${family}/fonts/`,
    ),
  ).join("\n");
  const name = `assets/carbon-${Bun.hash(css).toString(36).slice(0, 8)}.css`;
  fs.writeFileSync(path.join(OUTDIR, name), css);
  const html = fs.readFileSync(indexFile, "utf8");
  const link = '<link rel="stylesheet"';
  if (!html.includes(link)) throw new Error("index.html links no stylesheet");
  fs.writeFileSync(
    indexFile,
    html.replace(link, `${link} crossorigin href="/${name}">${link}`),
  );
  return path.join(OUTDIR, name);
}

/** Each route, by the module the router imports for it. */
function routeEntries() {
  const files = Array.from(
    new Bun.Glob("**/*").scanSync(PAGES),
    (file) => `./pages/${file.split(path.sep).join("/")}`,
  );
  return Object.fromEntries(
    Array.from(buildRoutes(files).routes.values(), (route) => [
      route.path,
      `docs/src/${route.file.slice("./".length)}`,
    ]),
  );
}

const start = performance.now();
fs.rmSync(OUTDIR, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [path.join(DOCS, "index.html")],
  // The repo root, so chunks from the library's `src/` and the site's
  // `docs/src/` get distinct names: two chunks with the same name and
  // content would otherwise collide.
  root: path.resolve(DOCS, ".."),
  outdir: OUTDIR,
  publicPath: "/",
  target: "browser",
  splitting: true,
  // Folds small chunks that have no top-level side effects into one their
  // importers already load: 90 fewer files, and a cold page 20 to 26 ms
  // sooner over HTTP/2.
  minChunkSize: 16384,
  minify: true,
  naming: {
    entry: "[name].[ext]",
    chunk: "assets/[dir]/[name]-[hash].[ext]",
    asset: "assets/[name]-[hash].[ext]",
  },
  external: [`${PLEX_URL}/*`],
  plugins: [
    carbonAlias,
    importMetaGlob,
    componentApi,
    componentMdSizes,
    siteModule({ dev: false }),
    framedStart({ dev: false }),
    carbonSheets,
    svelte({ ...options, production: true }),
    selfHostPlex({ nodeModules: NODE_MODULES, build: true }),
    page({
      routes: {
        entries: routeEntries,
        // The entry imports `App` lazily, so its chunks are preloaded too.
        shell: ["docs/src/App.svelte"],
        preloadShell: true,
        // A framed example loads only itself, in an iframe.
        exclude: (route) => route.startsWith(FRAMED_PREFIX),
      },
      minify: true,
    }),
  ],
});

fs.cpSync(path.join(DOCS, "public"), OUTDIR, { recursive: true });
const indexFile = path.join(OUTDIR, "index.html");
const fonts = copyPlexFonts(OUTDIR, NODE_MODULES, [
  indexFile,
  linkCarbonSheets(indexFile),
  ...result.outputs.map((output) => output.path),
]);

const bytes = result.outputs.reduce((sum, output) => sum + output.size, 0);
const seconds = ((performance.now() - start) / 1000).toFixed(2);
console.log(
  `${styleText("green", "✓")} Built dist/ in ${seconds} s: ${result.outputs.length} files, ${(bytes / 1e6).toFixed(1)} MB, and ${fonts} Plex fonts`,
);
