/**
 * The preloads that start loading a page's modules and styles alongside
 * the site's entry.
 *
 * The entry imports the site's app dynamically, so a framed example's page
 * doesn't load it, and the app imports each page dynamically. Without a
 * head start, the browser would find the app, and then its styles, only
 * once the entry had run, and the page's own modules only once the app
 * had: a round trip each. A script at the top of `index.html`, which the
 * host serves for every path, starts loading the app, and the current
 * page's modules from a manifest of every page's, so both load with the
 * entry. The manifest is in the script, not a file of its own: fetching it
 * would take the round trip it saves. It adds about 6 kB to `index.html`
 * compressed, which still arrives in the server's first round trip.
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { buildRoutes, FRAMED_PREFIX } from "../src/routes.ts";

/** The parts of an output chunk the preloads are read from. */
export type Chunk = {
  fileName: string;
  imports: string[];
  isEntry: boolean;
  facadeModuleId: string | null;
  viteMetadata?: { importedCss: Set<string> };
};

/** A link to add: `modulepreload` for a module, `preload` for styles. */
export type Preload = [rel: "modulepreload" | "preload", href: string];

/**
 * What loading `start` fetches beyond `loaded`: its module and the ones it
 * imports statically, then their styles. Adds them to `loaded`.
 */
export function preloadsFor(
  chunks: Map<string, Chunk>,
  start: string,
  loaded: Set<string>,
  base = "/",
): Preload[] {
  const modules: string[] = [];
  const add = (file: string) => {
    if (loaded.has(file)) return;
    loaded.add(file);
    modules.push(file);
    for (const next of chunks.get(file)?.imports ?? []) add(next);
  };
  add(start);
  const preloads = modules.map((file): Preload => [
    "modulepreload",
    base + file,
  ]);
  for (const file of modules) {
    for (const style of chunks.get(file)?.viteMetadata?.importedCss ?? []) {
      if (loaded.has(style)) continue;
      loaded.add(style);
      preloads.push(["preload", base + style]);
    }
  }
  return preloads;
}

export type PageManifest = {
  /** Every page's files, relative to the base URL. */
  files: string[];
  /** Each page's path, and the indexes in `files` of what it loads. */
  pages: Record<string, number[]>;
};

/** The manifest of `pages`, a map from each page's path to its preloads. */
export function pageManifest(
  pages: Map<string, Preload[]>,
  base = "/",
): PageManifest {
  const files: string[] = [];
  const indexes = new Map<string, number>();
  const manifest: PageManifest = { files, pages: {} };
  for (const [page, preloads] of pages) {
    manifest.pages[page] = preloads.map(([, href]) => {
      const file = href.slice(base.length);
      let index = indexes.get(file);
      if (index === undefined) {
        index = files.push(file) - 1;
        indexes.set(file, index);
      }
      return index;
    });
  }
  return manifest;
}

/**
 * The script in `index.html`. Its `add` makes a preload link, for styles
 * when the file is CSS. The page path is read as the router reads it:
 * unescaped, without a trailing slash.
 */
export function preloadScript(
  app: Preload[],
  manifest: PageManifest,
  base: string,
) {
  const hrefs = JSON.stringify(app.map(([, href]) => href));
  return `(()=>{const p=location.pathname;if(p.startsWith(${JSON.stringify(FRAMED_PREFIX)}))return;const add=h=>{const l=document.createElement("link");if(h.endsWith(".css")){l.rel="preload";l.as="style"}else l.rel="modulepreload";l.href=h;l.crossOrigin="";document.head.append(l)};${hrefs}.forEach(add);const m=${JSON.stringify(manifest)};let k;try{k=decodeURI(p)}catch{return}if(k.length>1&&k.endsWith("/"))k=k.slice(0,-1);for(const i of m.pages[k]??[])add(${JSON.stringify(base)}+m.files[i])})()`;
}

/** Marks where the preload script goes in `index.html`. */
const SCRIPT_MARKER = "<!--page-preloads-->";

const PAGES_PREFIX = "./pages/";

/** Writes the preload script into `index.html`. */
export function pageHtml(pagesDir: string): Plugin {
  let base = "/";
  let outDir = "";
  return {
    name: "page-html",
    apply: "build",
    configResolved(config) {
      base = config.base;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "post",
      handler: () => [
        // Before the stylesheets, which a classic script waits for.
        { tag: "script", injectTo: "head-prepend", children: SCRIPT_MARKER },
      ],
    },
    writeBundle(_options, bundle) {
      const chunks = new Map<string, Chunk>();
      for (const output of Object.values(bundle)) {
        if (output.type === "chunk") chunks.set(output.fileName, output);
      }
      const byModule = new Map(
        [...chunks.values()].map((chunk) => [chunk.facadeModuleId, chunk]),
      );
      const chunkOf = (file: string) => {
        const id = path.join(pagesDir, file.slice(PAGES_PREFIX.length));
        const chunk = byModule.get(id);
        if (!chunk) throw new Error(`page-html: no chunk for ${file}`);
        return chunk.fileName;
      };

      // What the entry imports statically already has a modulepreload.
      const entry = new Set<string>();
      for (const chunk of chunks.values()) {
        if (chunk.isEntry) preloadsFor(chunks, chunk.fileName, entry);
      }
      const app = [...chunks.values()].find((chunk) =>
        chunk.facadeModuleId?.endsWith("/src/App.svelte"),
      );
      if (!app) throw new Error("page-html: no chunk for App.svelte");
      const appLoaded = new Set(entry);
      const appPreloads = preloadsFor(chunks, app.fileName, appLoaded, base);
      /** What a page loads beyond the app. */
      const pageOnly = (file: string) =>
        preloadsFor(chunks, chunkOf(file), new Set(appLoaded), base);

      const files = fs
        .readdirSync(pagesDir, { recursive: true, encoding: "utf8" })
        .map((file) => PAGES_PREFIX + file.split(path.sep).join("/"));
      const { routes } = buildRoutes(files);
      const pages = new Map<string, Preload[]>();
      for (const route of routes.values()) {
        if (route.path.startsWith(FRAMED_PREFIX)) continue;
        pages.set(route.path, pageOnly(route.file));
      }

      const indexFile = path.join(outDir, "index.html");
      const script = preloadScript(
        appPreloads,
        pageManifest(pages, base),
        base,
      );
      fs.writeFileSync(
        indexFile,
        fs.readFileSync(indexFile, "utf8").replace(SCRIPT_MARKER, script),
      );
    },
  };
}
