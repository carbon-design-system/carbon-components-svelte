/**
 * Builds the immutable artifacts the REPL preview loads at runtime:
 *
 *   dist/pkg/svelte@<v>/*.js                        Svelte client runtime (one entry per subpath, shared chunks)
 *   dist/pkg/ccs@local/svelte@<v>/src/**            carbon-components-svelte, compiled 1:1 from ../src
 *   dist/pkg/ccs@local/svelte@<v>/manifest.json     export → module, direct deps per module, runtime map
 *   dist/pkg/ccs@local/vendor/*.js                  allowlisted third-party deps (flatpickr + plugins)
 *   dist/pkg/ccs@local/css/all.css                  Carbon styles
 *   dist/pkg/icons@<v>/svelte@<v>/lib/*.svelte      carbon-icons-svelte, compiled 1:1
 *   dist/pkg/icons@<v>/icons.json                   icon names
 *   dist/sandbox/ccs@local/svelte@<v>/index.html    preview document (import map + runtime preloads)
 *   dist/compiler/svelte@<v>.js                     compiler for the worker
 *
 * Usage: bun scripts/build-artifacts.ts [--force-icons]
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { brotliCompressSync } from "node:zlib";
import { compile, VERSION } from "svelte/compiler";

const REPL = resolve(import.meta.dir, "..");
const ROOT = resolve(REPL, "..");
const DIST = join(REPL, "dist");
const CACHE = join(REPL, ".cache");
const FORCE_ICONS = process.argv.includes("--force-icons");

const SVELTE_V = VERSION;
const ICONS_V = readJson(
  join(ROOT, "node_modules/carbon-icons-svelte/package.json"),
).version;
const CCS_V = "local";

const PKG = join(DIST, "pkg");
const RUNTIME_DIR = join(PKG, `svelte@${SVELTE_V}`);
const CCS_DIR = join(PKG, `ccs@${CCS_V}`, `svelte@${SVELTE_V}`);
const VENDOR_DIR = join(PKG, `ccs@${CCS_V}`, "vendor");
const ICONS_DIR = join(PKG, `icons@${ICONS_V}`, `svelte@${SVELTE_V}`);
const SANDBOX_DIR = join(DIST, "sandbox");

const url = (abs: string) => `/${relative(DIST, abs).split("\\").join("/")}`;

/** Every `svelte/*` specifier compiled client code or the library can import. */
const RUNTIME_SPECIFIERS = [
  "svelte",
  "svelte/internal/client",
  "svelte/internal/disclose-version",
  "svelte/internal/flags/legacy",
  "svelte/internal/flags/async",
  "svelte/store",
  "svelte/transition",
  "svelte/easing",
  "svelte/animate",
  "svelte/motion",
  "svelte/legacy",
  "svelte/events",
  "svelte/reactivity",
  "svelte/reactivity/window",
  "svelte/attachments",
];

/** Allowlisted third-party specifiers reachable from the library (static or dynamic). */
const VENDOR_SPECIFIERS = [
  "flatpickr",
  "flatpickr/dist/esm/plugins/rangePlugin",
  "flatpickr/dist/esm/plugins/monthSelect",
  "flatpickr/dist/esm/plugins/weekSelect/weekSelect",
];

/** Runtime entries nearly every preview needs; only their closure is preloaded. */
const CORE_RUNTIME = [
  "svelte",
  "svelte/internal/client",
  "svelte/internal/disclose-version",
  "svelte/internal/flags/legacy",
  "svelte/store",
];

const COMPILE_OPTIONS = {
  generate: "client",
  dev: false,
  css: "injected",
} as const;

const sizes: Array<[string, number, number]> = [];

function readJson(file: string) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function write(file: string, contents: string) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function brotliSize(text: string) {
  return brotliCompressSync(Buffer.from(text)).length;
}

const IMPORT_RE =
  /(?:^|[\n;])\s*(?:import|export)\s*(?:[\w$*{}\s,]+?\s*from\s*)?(['"])([^'"\n]+)\1/g;

/** Static import/export-from specifiers (dynamic imports are resolved lazily via the import map). */
function staticSpecifiers(code: string) {
  return [...code.matchAll(IMPORT_RE)].map((m) => m[2]);
}

/** Bundle entry stubs with Bun.build so every entry shares one module instance per chunk. */
async function bundle(
  specifiers: string[],
  outdir: string,
  stub: (s: string) => string,
) {
  const stubDir = join(CACHE, "stubs", relative(PKG, outdir));
  rmSync(stubDir, { recursive: true, force: true });
  const entries = new Map<string, string>();
  for (const s of specifiers) {
    const name = s.replace(/[^\w]+/g, "__");
    const file = join(stubDir, `${name}.js`);
    write(file, stub(s));
    entries.set(s, name);
  }
  rmSync(outdir, { recursive: true, force: true });
  const result = await Bun.build({
    entrypoints: [...entries.keys()].map((s) =>
      join(stubDir, `${entries.get(s)}.js`),
    ),
    outdir,
    target: "browser",
    format: "esm",
    splitting: true,
    minify: true,
    conditions: ["browser", "production"],
    define: { "process.env.NODE_ENV": '"production"' },
    naming: { entry: "[name].js", chunk: "chunk-[hash].js" },
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error(`Bundling failed for ${outdir}`);
  }
  const map: Record<string, string> = {};
  for (const [s, name] of entries) map[s] = url(join(outdir, `${name}.js`));
  const files = result.outputs.map((o) => url(o.path));
  let total = 0;
  for (const o of result.outputs)
    total += brotliSize(readFileSync(o.path, "utf8"));
  sizes.push([relative(PKG, outdir), result.outputs.length, total]);
  return { map, files };
}

function buildRuntime() {
  return bundle(
    RUNTIME_SPECIFIERS,
    RUNTIME_DIR,
    (s) => `export * from "${s}";\n`,
  );
}

function buildVendor() {
  // Every allowlisted vendor module has a default export (or is CJS/UMD, where
  // Bun's interop provides one), matching how the library imports them.
  return bundle(
    VENDOR_SPECIFIERS,
    VENDOR_DIR,
    (s) => `export { default } from "${s}";\nexport * from "${s}";\n`,
  );
}

function compileTree(
  srcRoot: string,
  outRoot: string,
  files: string[],
  label: string,
) {
  const deps: Record<string, string[]> = {};
  const failures: string[] = [];
  let total = 0;
  const started = performance.now();
  for (const file of files) {
    const rel = relative(srcRoot, file).split("\\").join("/");
    let code: string;
    if (file.endsWith(".svelte")) {
      try {
        code = compile(readFileSync(file, "utf8"), {
          ...COMPILE_OPTIONS,
          filename: rel,
        }).js.code;
      } catch (error) {
        failures.push(`${rel}: ${(error as Error).message.split("\n")[0]}`);
        continue;
      }
    } else {
      code = readFileSync(file, "utf8");
    }
    write(join(outRoot, rel), code);
    total += brotliSize(code);
    deps[rel] = staticSpecifiers(code).map((s) =>
      s.startsWith(".")
        ? posix.normalize(posix.join(posix.dirname(rel), s))
        : s,
    );
  }
  sizes.push([label, files.length - failures.length, total]);
  console.log(
    `${label}: ${files.length - failures.length}/${files.length} modules in ${Math.round(performance.now() - started)} ms`,
  );
  for (const f of failures) console.warn(`  ✗ ${f}`);
  return deps;
}

function parseIndexExports(indexFile: string) {
  const exports: Record<string, { path: string; name: string }> = {};
  const source = readFileSync(indexFile, "utf8");
  for (const m of source.matchAll(/export\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
    const path = posix.normalize(posix.join("src", m[2]));
    for (const part of m[1].split(",")) {
      const item = part.trim();
      if (!item) continue;
      const [name, alias] = item.split(/\s+as\s+/);
      exports[alias ?? name] = { path, name };
    }
  }
  return exports;
}

function writeSandbox(
  runtime: { map: Record<string, string>; files: string[] },
  vendor: { map: Record<string, string> },
) {
  const importMap = {
    imports: {
      ...runtime.map,
      ...vendor.map,
      "carbon-components-svelte/": `${url(CCS_DIR)}/`,
      "carbon-icons-svelte/lib/": `${url(join(ICONS_DIR, "lib"))}/`,
    },
  };
  const importMapText = JSON.stringify(importMap);
  const hash = createHash("sha256").update(importMapText).digest("base64");
  const closure = new Set<string>();
  const visit = (u: string) => {
    if (closure.has(u)) return;
    closure.add(u);
    const code = readFileSync(join(DIST, u), "utf8");
    for (const s of staticSpecifiers(code))
      if (s.startsWith(".")) visit(posix.join(posix.dirname(u), s));
  };
  for (const s of CORE_RUNTIME) visit(runtime.map[s]);
  const preloads = [...closure]
    .map((f) => `<link rel="modulepreload" href="${f}">`)
    .join("\n    ");
  const html = `<!doctype html>
<html lang="en" theme="white">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="importmap">${importMapText}</script>
    ${preloads}
    <link rel="stylesheet" href="${url(join(PKG, `ccs@${CCS_V}`, "css/all.css"))}">
    <link rel="stylesheet" href="/sandbox/sandbox.css">
    <script type="module" src="/sandbox/sandbox.js"></script>
  </head>
  <body></body>
</html>
`;
  const dir = join(SANDBOX_DIR, `ccs@${CCS_V}`, `svelte@${SVELTE_V}`);
  write(join(dir, "index.html"), html);
  write(
    join(dir, "csp.json"),
    JSON.stringify({ scriptHashes: [`sha256-${hash}`] }),
  );
  for (const f of ["sandbox.js", "sandbox.css"]) {
    copyFileSync(join(REPL, "sandbox", f), join(SANDBOX_DIR, f));
  }
}

async function main() {
  const allCss = join(ROOT, "css/all.css");
  if (!existsSync(allCss)) {
    throw new Error(
      "css/all.css is missing. Run `bun run build:css` at the repo root first.",
    );
  }

  const started = performance.now();
  const [runtime, vendor] = await Promise.all([buildRuntime(), buildVendor()]);

  // carbon-components-svelte
  rmSync(CCS_DIR, { recursive: true, force: true });
  const srcFiles = walk(join(ROOT, "src")).filter(
    (f) => (f.endsWith(".svelte") || f.endsWith(".js")) && !f.endsWith(".d.ts"),
  );
  const deps = compileTree(
    ROOT,
    CCS_DIR,
    srcFiles,
    `ccs@${CCS_V}/svelte@${SVELTE_V}`,
  );
  const exports = parseIndexExports(join(ROOT, "src/index.js"));
  mkdirSync(join(PKG, `ccs@${CCS_V}`, "css"), { recursive: true });
  copyFileSync(allCss, join(PKG, `ccs@${CCS_V}`, "css/all.css"));
  sizes.push([
    `ccs@${CCS_V}/css/all.css`,
    1,
    brotliSize(readFileSync(allCss, "utf8")),
  ]);

  // carbon-icons-svelte (stable; rebuilt only when missing or forced)
  const iconsLib = join(ROOT, "node_modules/carbon-icons-svelte/lib");
  const iconNames = readdirSync(iconsLib)
    .filter((f) => f.endsWith(".svelte"))
    .map((f) => f.slice(0, -".svelte".length));
  if (FORCE_ICONS || !existsSync(join(ICONS_DIR, "lib"))) {
    rmSync(ICONS_DIR, { recursive: true, force: true });
    compileTree(
      dirname(iconsLib),
      ICONS_DIR,
      iconNames.map((n) => join(iconsLib, `${n}.svelte`)),
      `icons@${ICONS_V}/svelte@${SVELTE_V}`,
    );
  } else {
    console.log(`icons@${ICONS_V}: up to date (use --force-icons to rebuild)`);
  }
  write(
    join(PKG, `icons@${ICONS_V}`, "icons.json"),
    JSON.stringify({ names: iconNames }),
  );

  const manifest = {
    ccs: CCS_V,
    svelte: SVELTE_V,
    icons: ICONS_V,
    base: url(CCS_DIR),
    iconsBase: url(join(ICONS_DIR, "lib")),
    iconsIndex: url(join(PKG, `icons@${ICONS_V}`, "icons.json")),
    runtime: runtime.map,
    runtimeFiles: runtime.files,
    vendor: vendor.map,
    exports,
    deps,
  };
  write(join(CCS_DIR, "manifest.json"), JSON.stringify(manifest));

  writeSandbox(runtime, vendor);

  mkdirSync(join(DIST, "compiler"), { recursive: true });
  copyFileSync(
    join(ROOT, "node_modules/svelte/compiler/index.js"),
    join(DIST, "compiler", `svelte@${SVELTE_V}.js`),
  );

  console.log("\nartifacts (brotli):");
  for (const [label, count, bytes] of sizes) {
    console.log(
      `  ${label.padEnd(44)} ${String(count).padStart(5)} files  ${(bytes / 1024).toFixed(1).padStart(8)} kB`,
    );
  }
  console.log(
    `\ndone in ${Math.round(performance.now() - started)} ms → ${relative(ROOT, DIST)}`,
  );
}

await main();
