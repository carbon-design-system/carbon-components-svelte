// @depends-on src/** tests/fixtures/hydrate/**
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = fileURLToPath(new URL("../..", import.meta.url));

export type BuildOptions = {
  /** `.svelte` files to compile. One build covers all of them. */
  fixtures: string[];
};

export type BuildResult = {
  /** Holds `runtime.js` plus one `<entry>.js` per fixture. */
  serverDir: string;
  clientDir: string;
  /** Absolute fixture path to its entry name in both output dirs. */
  entries: Map<string, string>;
  svelteVersion: string;
  ms: { server: number; client: number };
  /** Deletes the build output. */
  dispose: () => void;
};

/** The ESM entry of a package installed at or above `dir`. */
function packageEntry(dir: string, name: string) {
  for (let current = dir; ; current = path.dirname(current)) {
    const pkgDir = path.join(current, "node_modules", name);
    const pkgFile = path.join(pkgDir, "package.json");

    if (fs.existsSync(pkgFile)) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
      let entry = pkg.exports?.["."] ?? pkg.module ?? pkg.main;
      while (entry && typeof entry === "object") {
        entry = entry.import ?? entry.default;
      }
      return { dir: pkgDir, version: String(pkg.version), entry };
    }
    if (current === path.dirname(current)) {
      throw new Error(`Cannot find "${name}" from ${dir}`);
    }
  }
}

function importPackage<T>(dir: string, name: string): Promise<T> {
  const { dir: pkgDir, entry } = packageEntry(dir, name);
  return import(pathToFileURL(path.join(pkgDir, entry)).href);
}

const SVELTE_EXTENSION = /\.svelte$/;
const NON_WORD = /\W+/g;

function entryName(file: string) {
  return path
    .relative(REPO, file)
    .replace(SVELTE_EXTENSION, "")
    .replace(NON_WORD, "_");
}

let buildCount = 0;

/**
 * Compiles `fixtures` twice with Vite: a server bundle (`build.ssr`) and a
 * client bundle (`build.lib`, Svelte dev mode so hydration warnings exist).
 * Svelte is bundled into each output, so every fixture on one side shares a
 * single runtime with that side's `runtime.js`.
 *
 * Output goes to `node_modules/.cache/ccs-hydrate/` under the repo root:
 * Vite's `root` must sit below that `node_modules` so `svelte` resolves to the
 * install being tested, and Vitest loads files under `node_modules` natively
 * instead of transforming them again.
 */
export async function buildFixtures(opts: BuildOptions): Promise<BuildResult> {
  const svelteVersion = packageEntry(REPO, "svelte").version;

  if (Number(svelteVersion.split(".")[0]) < 5) {
    throw new Error(
      `Hydration builds support Svelte 5 only (found ${svelteVersion})`,
    );
  }

  const fixtures = [...new Set(opts.fixtures.map((f) => path.resolve(f)))];
  const hash = createHash("sha1")
    .update(JSON.stringify({ fixtures, pid: process.pid, n: buildCount++ }))
    .digest("hex")
    .slice(0, 12);
  const base = path.join(REPO, "node_modules/.cache/ccs-hydrate", hash);
  const serverDir = path.join(base, "server");
  const clientDir = path.join(base, "client");
  const entries = new Map(fixtures.map((f) => [f, entryName(f)]));
  const input = Object.fromEntries(
    fixtures.map((f) => [entries.get(f) as string, f]),
  );

  fs.rmSync(base, { recursive: true, force: true });
  fs.mkdirSync(base, { recursive: true });
  const serverRuntime = path.join(base, "server-runtime.js");
  const clientRuntime = path.join(base, "client-runtime.js");
  fs.writeFileSync(serverRuntime, `export { render } from "svelte/server";\n`);
  fs.writeFileSync(
    clientRuntime,
    `export { flushSync, hydrate, tick, unmount } from "svelte";\n`,
  );

  const vite = await importPackage<typeof import("vite")>(REPO, "vite");
  const { svelte, vitePreprocess } = await importPackage<
    typeof import("@sveltejs/vite-plugin-svelte")
  >(REPO, "@sveltejs/vite-plugin-svelte");

  const shared = {
    configFile: false,
    mode: "development",
    root: base,
    publicDir: false,
    logLevel: "error",
    plugins: [
      svelte({
        configFile: false,
        preprocess: [vitePreprocess()],
        compilerOptions: { dev: true },
        // Compile-time a11y and unused-export warnings are not hydration drift.
        onwarn: () => {},
      }),
    ],
    resolve: {
      alias: { "carbon-components-svelte": path.join(REPO, "src") },
      dedupe: ["svelte"],
    },
  } satisfies import("vite").InlineConfig;

  // vite-plugin-svelte turns `dev` off when `NODE_ENV` is "production", and
  // Svelte only emits hydration warnings in dev.
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  const ms = { server: 0, client: 0 };

  try {
    let start = performance.now();
    await vite.build({
      ...shared,
      ssr: { noExternal: true },
      build: {
        ssr: true,
        outDir: serverDir,
        emptyOutDir: true,
        minify: false,
        rolldownOptions: {
          input: { runtime: serverRuntime, ...input },
          output: {
            format: "es",
            entryFileNames: "[name].js",
            chunkFileNames: "chunks/[name]-[hash].js",
          },
        },
      },
    });
    ms.server = Math.round(performance.now() - start);

    start = performance.now();
    await vite.build({
      ...shared,
      resolve: { ...shared.resolve, conditions: ["browser", "development"] },
      define: { "process.env.NODE_ENV": JSON.stringify("development") },
      build: {
        outDir: clientDir,
        emptyOutDir: true,
        minify: false,
        cssCodeSplit: false,
        lib: {
          entry: { runtime: clientRuntime, ...input },
          formats: ["es"],
          fileName: (_format, name) => `${name}.js`,
        },
        rolldownOptions: {
          output: { chunkFileNames: "chunks/[name]-[hash].js" },
        },
      },
    });
    ms.client = Math.round(performance.now() - start);
  } catch (error) {
    fs.rmSync(base, { recursive: true, force: true });
    throw error;
  } finally {
    if (nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else process.env.NODE_ENV = nodeEnv;
  }

  return {
    serverDir,
    clientDir,
    entries,
    svelteVersion,
    ms,
    dispose: () => fs.rmSync(base, { recursive: true, force: true }),
  };
}
