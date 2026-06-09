import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import autoprefixer from "autoprefixer";
import { Glob } from "bun";
import postcss from "postcss";
import { initAsyncCompiler } from "sass-embedded";

const PARTIAL_FILE_REGEX = /^_/;
const CACHE_DIR = ".cache/build-css";

const SASS_OPTIONS = {
  style: "compressed" as const,
  sourceMap: false,
  loadPaths: ["node_modules"],
  quietDeps: true,
  silenceDeprecations: [
    "import",
    "global-builtin",
    "color-functions",
    "if-function",
  ],
};

const glob = new Glob("*.scss");
const scss = Array.from(glob.scanSync({ cwd: "css" }))
  .filter((file) => !PARTIAL_FILE_REGEX.test(file))
  .map((file) => path.parse(file));

async function readPartialContents(): Promise<string> {
  const partialGlob = new Glob("_*.scss");
  const partials = Array.from(partialGlob.scanSync({ cwd: "css" })).sort();
  return (
    await Promise.all(partials.map((file) => readFile(`css/${file}`, "utf8")))
  ).join("\0");
}

async function sharedInputs(): Promise<string> {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    devDependencies?: { "carbon-components"?: string };
  };

  return [
    await readPartialContents(),
    packageJson.devDependencies?.["carbon-components"] ?? "",
  ].join("\0");
}

function inputHash(entryContents: string, shared: string): string {
  const hash = createHash("sha256");
  hash.update(entryContents);
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

console.time("[build-css]");

await mkdir(CACHE_DIR, { recursive: true });

const shared = await sharedInputs();
const entryContents = await Promise.all(
  scss.map(async ({ base }) => ({
    base,
    contents: await readFile(`css/${base}`, "utf8"),
  })),
);

const compiler = await initAsyncCompiler();

try {
  await Promise.all(
    scss.map(async ({ name, base }) => {
      const file = `css/${base}`;
      const outFile = `css/${name}.css`;
      const contents =
        entryContents.find((entry) => entry.base === base)?.contents ?? "";
      const hash = inputHash(contents, shared);

      if (await isCached(name, hash)) {
        console.log("[build-css]", file, "-->", outFile, "(cached)");
        return;
      }

      console.log("[build-css]", file, "-->", outFile);

      const { css } = await compiler.compileAsync(file, SASS_OPTIONS);

      const prefixed = await postcss([
        autoprefixer({
          overrideBrowserslist: ["last 1 version", "ie >= 11", "Firefox ESR"],
        }),
      ]).process(css, { from: undefined });

      await Bun.write(outFile, prefixed.css);
      await writeFile(`${CACHE_DIR}/${name}.hash`, `${hash}\n`);
    }),
  );
} finally {
  await compiler.dispose();
}

const cssTypes = scss
  .map(
    ({ name }) => `declare module "carbon-components-svelte/css/${name}.css";`,
  )
  .join("\n");

await Bun.write("css/css.d.ts", `${cssTypes}\n`);

console.timeEnd("[build-css]");
