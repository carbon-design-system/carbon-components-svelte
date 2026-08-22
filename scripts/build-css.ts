import { createHash } from "node:crypto";
import { watch } from "node:fs";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import browserslist from "browserslist";
import { Glob } from "bun";
import { browserslistToTargets, transform } from "lightningcss";
import { initAsyncCompiler } from "sass-embedded";

const PARTIAL_FILE_REGEX = /^_/;
const CACHE_DIR = ".cache/build-css";
const WATCH = process.argv.includes("--watch");
// Svelte 5 minimum browsers — https://svelte.dev/docs/svelte/browser-support
const BROWSERSLIST = [
  "Chrome >= 87",
  "Firefox >= 83",
  "Safari >= 14",
  "Edge >= 87",
] as const;
const targets = browserslistToTargets(browserslist([...BROWSERSLIST]));

function minifyEnabled(): boolean {
  if (process.env.BUILD_CSS_MINIFY === "0") return false;
  if (process.env.BUILD_CSS_MINIFY === "1") return true;
  return process.env.CI === "true";
}

const MINIFY = minifyEnabled();

function postprocessCss(css: string, outFile: string): Uint8Array {
  const { code } = transform({
    filename: outFile,
    code: Buffer.from(css, "utf8"),
    targets,
    minify: true,
  });
  return code;
}

const SASS_OPTIONS = {
  style: "compressed" as const,
  sourceMap: false,
  // Resolves `@import "carbon-components/..."` to the vendored tree in
  // css/vendor (inlined from carbon-components@10.58.15).
  loadPaths: ["css/vendor"],
  quietDeps: true,
  silenceDeprecations: [
    "import",
    "global-builtin",
    "color-functions",
    "if-function",
  ],
};

function themeEntries() {
  return Array.from(new Glob("*.scss").scanSync({ cwd: "css" }))
    .filter((file) => !PARTIAL_FILE_REGEX.test(file))
    .sort()
    .map((file) => path.parse(file));
}

async function hashPathStats(files: string[], cwd: string): Promise<string> {
  const hash = createHash("sha256");
  const stats = await Promise.all(
    files.map((file) => stat(path.join(cwd, file))),
  );
  files.forEach((file, i) => {
    hash.update(file);
    hash.update("\0");
    hash.update(String(stats[i].mtimeMs));
    hash.update("\0");
    hash.update(String(stats[i].size));
    hash.update("\0");
  });
  return hash.digest("hex");
}

async function hashGlob(pattern: string, cwd: string): Promise<string> {
  const files = Array.from(new Glob(pattern).scanSync({ cwd })).sort();
  return await hashPathStats(files, cwd);
}

async function sharedInputs(): Promise<string> {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    devDependencies?: {
      lightningcss?: string;
      browserslist?: string;
    };
  };

  return [
    await hashGlob("_*.scss", "css"),
    await hashGlob("vendor/**/*.scss", "css"),
    packageJson.devDependencies?.lightningcss ?? "",
    packageJson.devDependencies?.browserslist ?? "",
    BROWSERSLIST.join(","),
    MINIFY ? "lightningcss-single-pass" : "sass-compressed",
    "stat-cache-v1",
  ].join("\0");
}

function inputHash(entryMtimeSize: string, shared: string): string {
  const hash = createHash("sha256");
  hash.update(entryMtimeSize);
  hash.update(shared);
  return hash.digest("hex");
}

async function isCached(name: string, hash: string): Promise<boolean> {
  try {
    const cachedHash = (
      await readFile(`${CACHE_DIR}/${name}.hash`, "utf8")
    ).trim();
    if (cachedHash !== hash) return false;
    await access(`css/${name}.css`);
    return true;
  } catch {
    return false;
  }
}

function ms(started: number): string {
  return `${Math.round(performance.now() - started)}ms`;
}

type Compiler = Awaited<ReturnType<typeof initAsyncCompiler>>;

async function build(compiler: Compiler): Promise<void> {
  const started = performance.now();
  await mkdir(CACHE_DIR, { recursive: true });

  const keyStarted = performance.now();
  const shared = await sharedInputs();
  const scss = themeEntries();
  const entryStats = await Promise.all(
    scss.map(async ({ base }) => ({
      base,
      stamp: await hashPathStats([base], "css"),
    })),
  );
  console.log("[build-css] cache keys", ms(keyStarted));

  let compiled = 0;
  let cached = 0;
  const workStarted = performance.now();

  await Promise.all(
    scss.map(async ({ name, base }) => {
      const file = `css/${base}`;
      const outFile = `css/${name}.css`;
      const stamp =
        entryStats.find((entry) => entry.base === base)?.stamp ?? "";
      const hash = inputHash(stamp, shared);

      if (await isCached(name, hash)) {
        cached += 1;
        console.log("[build-css]", file, "-->", outFile, "(cached)");
        return;
      }

      console.log("[build-css]", file, "-->", outFile);
      compiled += 1;

      const { css } = await compiler.compileAsync(file, SASS_OPTIONS);
      const code = MINIFY ? postprocessCss(css, outFile) : css;

      await Bun.write(outFile, code);
      await writeFile(`${CACHE_DIR}/${name}.hash`, `${hash}\n`);
    }),
  );

  const cssTypes = `${scss
    .map(
      ({ name }) =>
        `declare module "carbon-components-svelte/css/${name}.css";`,
    )
    .join("\n")}\n`;
  const previousTypes = await readFile("css/css.d.ts", "utf8").catch(() => "");
  if (previousTypes !== cssTypes) {
    await Bun.write("css/css.d.ts", cssTypes);
  }

  console.log(
    [
      "[build-css]",
      `${compiled} compiled`,
      `${cached} cached`,
      MINIFY ? "minify on" : "minify off",
      compiled ? `compile ${ms(workStarted)}` : "",
      `total ${ms(started)}`,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function isScssChange(filename: string | null): boolean {
  if (!filename) return true;
  return filename.endsWith(".scss");
}

const compiler = await initAsyncCompiler();
let keepAlive = false;

try {
  await build(compiler);

  if (WATCH) {
    keepAlive = true;
    console.log("[build-css] watching css/**/*.scss");
    let pending: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let rerun = false;

    const kick = () => {
      if (running) {
        rerun = true;
        return;
      }
      running = true;
      build(compiler)
        .catch((error: unknown) => {
          console.error(error);
        })
        .finally(() => {
          running = false;
          if (rerun) {
            rerun = false;
            kick();
          }
        });
    };

    watch("css", { recursive: true }, (_event, filename) => {
      if (!isScssChange(filename)) return;
      clearTimeout(pending);
      pending = setTimeout(kick, 150);
    });

    await new Promise<void>((resolve) => {
      const stop = () => {
        compiler.dispose().finally(() => resolve());
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
    });
  }
} finally {
  if (!keepAlive) {
    await compiler.dispose();
  }
}
