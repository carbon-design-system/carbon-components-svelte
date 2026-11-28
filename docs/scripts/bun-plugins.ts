/**
 * The plugins the site needs on top of svelte-bun, shared by the build
 * (`scripts/build.ts`), the dev server (`scripts/dev-plugin.ts`) and the
 * server render of the examples (`scripts/render-examples.ts`). The
 * `virtual:site` module is in `site-module.ts`.
 */
import fs from "node:fs";
import path from "node:path";
import type { BunPlugin } from "bun";

const DOCS = path.resolve(import.meta.dirname, "..");
const CARBON = path.resolve(DOCS, "..");

/**
 * An alias bypasses `package.json#exports`, so each subpath export needs
 * its own entry. The first match wins.
 */
const CARBON_ALIASES: [RegExp, string][] = [
  [/^carbon-components-svelte$/, "src/index.js"],
  [/^carbon-components-svelte\/syntax$/, "src/syntax/index.js"],
  [/^carbon-components-svelte\/motion$/, "src/motion/index.js"],
  [/^carbon-components-svelte\/flags$/, "src/flags/index.js"],
  [/^carbon-components-svelte\/flags\/all$/, "src/flags/all.js"],
  [/^carbon-components-svelte\/tokens$/, "src/tokens/index.js"],
];

/** Resolves `carbon-components-svelte` to this repo's source. */
export const carbonAlias: BunPlugin = {
  name: "carbon-alias",
  setup(build) {
    build.onResolve({ filter: /^carbon-components-svelte(\/|$)/ }, (args) => {
      const alias = CARBON_ALIASES.find(([re]) => re.test(args.path));
      const file =
        alias?.[1] ?? args.path.slice("carbon-components-svelte/".length);
      return { path: path.join(CARBON, file) };
    });
  },
};

const UNSAFE_IN_CODE = /[<>\b\f\n\r\t\0\u2028\u2029]/g;

/** A string literal, safe to splice into code, even inside `<script>`. */
const literal = (value: string) =>
  JSON.stringify(value).replace(
    UNSAFE_IN_CODE,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );

const GLOB_CALL = /import\.meta\.glob(?:<[^()]*?>)?\(\s*(\[[\s\S]*?\])\s*\)/g;

/**
 * Rewrites each `import.meta.glob([...])` to an object literal of lazy
 * imports, keyed as Vite keys them: relative to `file`, sorted. A pattern
 * starting with `!` excludes what it matches.
 */
export function expandGlobs(code: string, file: string): string {
  return code.replace(GLOB_CALL, (_, list: string) => {
    const patterns: string[] = JSON.parse(list.replace(/,\s*\]$/, "]"));
    const dir = path.dirname(file);
    const bare = (pattern: string) => pattern.replace(/^!?\.\//, "");
    const exclude = patterns
      .filter((p) => p.startsWith("!"))
      .map((p) => new Bun.Glob(bare(p)));
    const files = new Set<string>();
    for (const pattern of patterns.filter((p) => !p.startsWith("!"))) {
      for (const match of new Bun.Glob(bare(pattern)).scanSync({ cwd: dir })) {
        const posix = match.split(path.sep).join("/");
        if (!exclude.some((glob) => glob.match(posix))) files.add(`./${posix}`);
      }
    }
    const entries = [...files]
      .sort()
      .map((f) => `${literal(f)}: () => import(${literal(f)})`);
    return `({\n${entries.join(",\n")}\n})`;
  });
}

/** `import.meta.glob` in the site's own modules, which Bun lacks. */
export const importMetaGlob: BunPlugin = {
  name: "import-meta-glob",
  setup(build) {
    build.onLoad({ filter: /[\\/]docs[\\/]src[\\/][^\\/]+\.ts$/ }, (args) => {
      const code = fs.readFileSync(args.path, "utf8");
      if (!code.includes("import.meta.glob")) return undefined;
      return { contents: expandGlobs(code, args.path), loader: "ts" };
    });
  },
};

const COMPONENT_API = path.join(DOCS, "src/COMPONENT_API.json");
const COMPONENT_API_PREFIX = "virtual:component-api/";

type ApiComponent = { moduleName: string; filePath: string };

/** Serves one component's API entry, so a page bundles only its own. */
export const componentApi: BunPlugin = {
  name: "component-api",
  setup(build) {
    let cache: { mtime: number; byName: Map<string, ApiComponent> } | undefined;
    const read = () => {
      const mtime = fs.statSync(COMPONENT_API).mtimeMs;
      if (cache?.mtime !== mtime) {
        const api = JSON.parse(fs.readFileSync(COMPONENT_API, "utf8")) as {
          components: ApiComponent[];
        };
        cache = {
          mtime,
          byName: new Map(api.components.map((c) => [c.moduleName, c])),
        };
      }
      return cache.byName;
    };
    build.onResolve({ filter: /^virtual:component-api\// }, (args) => ({
      path: args.path.slice(COMPONENT_API_PREFIX.length),
      namespace: "component-api",
    }));
    build.onLoad({ filter: /.*/, namespace: "component-api" }, (args) => {
      const byName = read();
      const value =
        args.path === "file-paths"
          ? Object.fromEntries([...byName].map(([n, c]) => [n, c.filePath]))
          : (byName.get(args.path) ?? null);
      return {
        contents: `export default ${JSON.stringify(value)}`,
        loader: "js",
        watchFiles: [COMPONENT_API],
      };
    });
  },
};

const COMPONENT_MD_SIZES = path.join(DOCS, "src/COMPONENT_MD_SIZES.json");

/**
 * `build:md-docs` writes the sizes; `dev` doesn't run it, so a missing
 * file reads as no sizes.
 */
export const componentMdSizes: BunPlugin = {
  name: "component-md-sizes",
  setup(build) {
    build.onResolve({ filter: /COMPONENT_MD_SIZES\.json$/ }, () => ({
      path: COMPONENT_MD_SIZES,
      namespace: "component-md-sizes",
    }));
    build.onLoad({ filter: /.*/, namespace: "component-md-sizes" }, () => ({
      contents: `export default ${
        fs.existsSync(COMPONENT_MD_SIZES)
          ? fs.readFileSync(COMPONENT_MD_SIZES, "utf8")
          : "{}"
      }`,
      loader: "js",
    }));
  },
};

/** Runs several plugins as one, for bunfig's `[serve.static]`. */
export function combine(name: string, plugins: BunPlugin[]): BunPlugin {
  return {
    name,
    async setup(build) {
      for (const plugin of plugins) {
        // eslint-disable-next-line no-await-in-loop -- in order: the first plugin to resolve a path wins.
        await plugin.setup(build);
      }
    },
  };
}
