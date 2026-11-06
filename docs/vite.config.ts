import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import pkg from "../package.json" with { type: "json" };
import { carbonAlias } from "./carbon-alias.ts";
import { cacheSvelteSteps } from "./scripts/compile-cache.ts";
import { PAGE_EXTENSION } from "./scripts/constants.ts";
import { formatterVersion } from "./scripts/format.ts";
import { pageHtml } from "./scripts/page-html.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentMdSizesPath = path.resolve(
  __dirname,
  "src/COMPONENT_MD_SIZES.json",
);
const componentMdSizesId = "\0component-md-sizes";
const libraryUtilsDir = `${path.resolve(__dirname, "../src/utils")}${path.sep}`;
/**
 * The library's `src/utils` modules are small and shared by most pages,
 * so on their own each became a chunk of a kilobyte or less, about 50 of
 * them per page. One chunk loads them in one request.
 */
const CHUNK_GROUPS = [
  {
    name: "library-utils",
    test: (id: string) => id.startsWith(libraryUtilsDir),
  },
];
/**
 * What changes compiled components without changing their code: Svelte,
 * vite-plugin-svelte, and the Svelte config's compiler options.
 */
const readVersion = (pkg: string) =>
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "node_modules", pkg, "package.json"),
      "utf8",
    ),
  ).version as string;

/** The contents of the files in `dir` with `extension`, for a cache salt. */
const filesIn = (dir: string, extension: string) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(extension))
    .sort()
    .map((file) => fs.readFileSync(path.join(dir, file), "utf8"));

/**
 * What changes compiled components without changing their code: Svelte,
 * vite-plugin-svelte, and the Svelte config's compiler options.
 */
const COMPILE_CACHE_SALT = JSON.stringify([
  readVersion("svelte"),
  readVersion("@sveltejs/vite-plugin-svelte"),
  fs.readFileSync(path.join(__dirname, "svelte.config.ts"), "utf8"),
]);

/**
 * What changes a preprocessed page without changing its source: the
 * Svelte config and the docs scripts it runs, the library's highlighter
 * (code blocks are highlighted at build time) and the formatter.
 */
const PREPROCESS_CACHE_SALT = JSON.stringify([
  COMPILE_CACHE_SALT,
  filesIn(path.join(__dirname, "scripts"), ".ts"),
  filesIn(path.resolve(__dirname, "../src/syntax"), ".js"),
  formatterVersion(),
]);

const FILE_SOURCE_RE = /<FileSource\s+src="([^"]+)"/g;

/** A page also depends on the framed examples its `<FileSource>` tags show. */
function fileSourceKey(code: string) {
  return Array.from(code.matchAll(FILE_SOURCE_RE), ([, src]) => {
    const file = path.join(__dirname, "src/pages", `${src}.svelte`);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  }).join("\0");
}
const componentApiPath = path.resolve(__dirname, "src/COMPONENT_API.json");
const COMPONENT_API_PREFIX = "virtual:component-api/";

type ApiComponent = { moduleName: string; filePath: string };

/**
 * `virtual:component-api/<Name>` is one component's entry in
 * `COMPONENT_API.json`, so a page bundles only the components it
 * documents; `virtual:component-api/file-paths` maps every component to
 * its source file.
 */
function componentApi() {
  let cache: { mtime: number; byName: Map<string, ApiComponent> } | undefined;
  const read = () => {
    const mtime = fs.statSync(componentApiPath).mtimeMs;
    if (cache?.mtime !== mtime) {
      const api = JSON.parse(fs.readFileSync(componentApiPath, "utf8")) as {
        components: ApiComponent[];
      };
      cache = {
        mtime,
        byName: new Map(api.components.map((c) => [c.moduleName, c])),
      };
    }
    return cache.byName;
  };
  return {
    name: "component-api",
    resolveId(source: string) {
      if (source.startsWith(COMPONENT_API_PREFIX)) return `\0${source}`;
    },
    load(this: { addWatchFile(file: string): void }, id: string) {
      if (!id.startsWith(`\0${COMPONENT_API_PREFIX}`)) return;
      this.addWatchFile(componentApiPath);
      const name = id.slice(COMPONENT_API_PREFIX.length + 1);
      const byName = read();
      const value =
        name === "file-paths"
          ? Object.fromEntries([...byName].map(([n, c]) => [n, c.filePath]))
          : (byName.get(name) ?? null);
      return `export default ${JSON.stringify(value)}`;
    },
  };
}
export default defineConfig({
  resolve: {
    alias: carbonAlias,
  },
  plugins: [
    componentApi(),
    pageHtml(path.join(__dirname, "src/pages")),
    {
      name: "component-md-sizes",
      resolveId(source) {
        if (source.endsWith("COMPONENT_MD_SIZES.json")) {
          return componentMdSizesId;
        }
      },
      load(id) {
        if (id !== componentMdSizesId) return;

        const json = fs.existsSync(componentMdSizesPath)
          ? fs.readFileSync(componentMdSizesPath, "utf8")
          : "{}";

        return `export default ${JSON.stringify(JSON.parse(json))}`;
      },
    },
    ...cacheSvelteSteps(
      svelte(),
      path.join(__dirname, "node_modules/.cache/ccs-docs-svelte-build"),
      [
        {
          plugin: "vite-plugin-svelte:preprocess",
          label: "preprocess",
          salt: PREPROCESS_CACHE_SALT,
          key: fileSourceKey,
          // Preprocessing only does work on pages; for components, reading
          // a cached result would cost more than the preprocess.
          include: (id: string) => id.endsWith(PAGE_EXTENSION),
        },
        {
          plugin: "vite-plugin-svelte:compile",
          label: "compile",
          salt: COMPILE_CACHE_SALT,
        },
      ],
    ),
  ],
  define: {
    __PKG_VERSION: JSON.stringify(pkg.version),
    __PKG_REPO: JSON.stringify(
      (pkg.repository?.url ?? "").replace(/^git\+/, "").replace(/\.git$/, ""),
    ),
  },
  optimizeDeps: {
    exclude: ["carbon-components-svelte", "carbon-icons-svelte"],
  },
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: CHUNK_GROUPS,
        },
      },
    },
  },
});
