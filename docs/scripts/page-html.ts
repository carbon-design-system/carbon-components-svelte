/**
 * The site's HTML files, each with a script that starts loading what its
 * page needs alongside the entry.
 *
 * The entry imports the site's app dynamically, so a framed example's page
 * doesn't load it, and the app imports each page dynamically. Without a
 * head start, the browser would find the app, and then its styles, only
 * once the entry had run, and the page's own modules only once the app
 * had: a round trip each. `index.html` starts loading the app, and the
 * home page's modules on the home page. Each other page also gets a file
 * of its own, `components/Button.html` for `/components/Button`, that
 * starts loading its modules too, and has the page's title and
 * description. The host serves a page's file when it has one, and
 * `index.html` for any other path.
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { buildRoutes, FRAMED_PREFIX } from "../src/routes.ts";
import { parseFrontmatter, splitFrontmatter } from "./frontmatter.ts";

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

/** The inline script that adds `preloads`, if `when` holds. */
function preloadScript(preloads: Preload[], when = "true") {
  return `if(${when})for(const[rel,href]of ${JSON.stringify(preloads)}){const link=document.createElement("link");link.rel=rel;link.href=href;link.crossOrigin="";if(rel==="preload")link.as="style";document.head.append(link)}`;
}

export type PageHead = { title?: string; description?: string };

const SITE_NAME = "Carbon Components Svelte";
const TITLE_RE = /<title>([^<{]+)<\/title>/;

/**
 * The title and description a page sets once it renders, read from its
 * source, so its HTML file has them for readers that don't run scripts,
 * such as link previews. A component page is titled with its name and a
 * guide page with its front matter's `title`; a Svelte page's own literal
 * `<title>` is used as written.
 */
export function pageHead(source: string, file: string): PageHead {
  if (!file.endsWith(".md")) {
    const title = TITLE_RE.exec(source)?.[1].trim();
    return title ? { title } : {};
  }
  const { frontmatter } = splitFrontmatter(source);
  const data = frontmatter ? parseFrontmatter(frontmatter) : {};
  const description =
    typeof data.description === "string" ? data.description : undefined;
  const title =
    data.layout === "guide"
      ? `${String(data.title)} · ${SITE_NAME}`
      : path.basename(file, ".md");
  return { title, description };
}

const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** `html` with `head`'s title and description in place of the site's. */
export function withHead(html: string, head: PageHead): string {
  let out = html;
  if (head.title) {
    out = out.replace(
      `<title>${SITE_NAME}</title>`,
      `<title>${escapeHtml(head.title)}</title>`,
    );
  }
  if (head.description) {
    out = out.replace(
      /(<meta\s+name="description"\s+content=")[^"]*"/,
      (_, start: string) => `${start}${escapeHtml(head.description ?? "")}"`,
    );
  }
  return out;
}

/** Marks where the preload script goes in `index.html`. */
const SCRIPT_MARKER = "<!--page-preloads-->";

const PAGES_PREFIX = "./pages/";

/** Writes the preloads into `index.html`, and a file for each other page. */
export function pageHtml(pagesDir: string): Plugin {
  let base = "/";
  let outDir = "";
  let logger: ResolvedConfig["logger"] | undefined;
  let written = 0;
  return {
    name: "page-html",
    apply: "build",
    configResolved(config) {
      base = config.base;
      outDir = path.resolve(config.root, config.build.outDir);
      logger = config.logger;
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

      const indexFile = path.join(outDir, "index.html");
      const index = fs.readFileSync(indexFile, "utf8");
      const fill = (script: string) => index.replace(SCRIPT_MARKER, script);

      // `index.html` is also what the host serves for a framed example, a
      // missing page and any page without its own file.
      const notFramed = `!location.pathname.startsWith(${JSON.stringify(FRAMED_PREFIX)})`;
      const home = routes.get("/");
      let script = preloadScript(appPreloads, notFramed);
      if (home) {
        script += `;${preloadScript(pageOnly(home.file), 'location.pathname==="/"')}`;
      }
      fs.writeFileSync(indexFile, fill(script));

      written = 0;
      for (const route of routes.values()) {
        if (route === home || route.path.startsWith(FRAMED_PREFIX)) continue;
        const file = path.join(outDir, `${route.path.slice(1)}.html`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const preloads = [...appPreloads, ...pageOnly(route.file)];
        const source = path.join(
          pagesDir,
          route.file.slice(PAGES_PREFIX.length),
        );
        const head = pageHead(fs.readFileSync(source, "utf8"), route.file);
        fs.writeFileSync(file, withHead(fill(preloadScript(preloads)), head));
        written++;
      }
    },
    // After the build's progress line.
    closeBundle() {
      if (written) logger?.info(`page html: ${written} pages`);
    },
  };
}
