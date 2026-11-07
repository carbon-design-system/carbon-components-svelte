/**
 * The entry imports the app dynamically, and the app imports each page
 * dynamically, so without preloads each costs a round trip. The manifest
 * is inlined in `index.html` because fetching it would cost the round trip
 * it saves. It adds about 6 kB compressed.
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { buildRoutes, FRAMED_PREFIX } from "../src/routes.ts";

export type Chunk = {
  fileName: string;
  imports: string[];
  isEntry: boolean;
  facadeModuleId: string | null;
  viteMetadata?: { importedCss: Set<string> };
};

export type Preload = [rel: "modulepreload" | "preload", href: string];

/** Modules first, then styles. Adds them to `loaded`. */
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
  /** Relative to the base URL. */
  files: string[];
  /** Indexes into `files`. */
  pages: Record<string, number[]>;
};

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

/** Reads the path as the router does: unescaped, no trailing slash. */
export function preloadScript(
  app: Preload[],
  manifest: PageManifest,
  base: string,
) {
  const hrefs = JSON.stringify(app.map(([, href]) => href));
  return `(()=>{const p=location.pathname;if(p.startsWith(${JSON.stringify(FRAMED_PREFIX)}))return;const add=h=>{const l=document.createElement("link");if(h.endsWith(".css")){l.rel="preload";l.as="style"}else l.rel="modulepreload";l.href=h;l.crossOrigin="";document.head.append(l)};${hrefs}.forEach(add);const m=${JSON.stringify(manifest)};let k;try{k=decodeURI(p)}catch{return}if(k.length>1&&k.endsWith("/"))k=k.slice(0,-1);for(const i of m.pages[k]??[])add(${JSON.stringify(base)}+m.files[i])})()`;
}

const SCRIPT_MARKER = "<!--page-preloads-->";

const PAGES_PREFIX = "./pages/";

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
