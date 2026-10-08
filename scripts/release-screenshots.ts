/**
 * Renders the `<!-- screenshot|video: name — text -->` markers in a GitHub
 * release body as 4x PNGs. See docs/release-screenshots.md.
 *
 *   bun scripts/release-screenshots.ts v0.113.0            # fetch notes with gh
 *   bun scripts/release-screenshots.ts notes.md meter box  # a saved file, some shots
 *   bun scripts/release-screenshots.ts v0.113.0 --scale 2 --out /tmp/shots
 *
 * Each marker's preceding ```svelte fence is bundled with src/ and
 * css/all.css (`bun run build:css`) and captured in your installed Chrome
 * through Bun.WebView. Edit scripts/lib/release-screenshot-recipes.ts for a
 * new release.
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { $, Glob } from "bun";
import { compile } from "svelte/compiler";
import { recipes } from "./lib/release-screenshot-recipes";
import {
  css,
  ev,
  extractSnippets,
  fingerprint,
  settle,
  type View,
  waitFor,
} from "./lib/release-screenshots";

const {
  positionals: [source, ...wanted],
  values: { scale: scaleArg, out, jobs: jobsArg, "no-cache": noCache },
} = parseArgs({
  allowPositionals: true,
  options: {
    scale: { type: "string", default: "4" },
    out: { type: "string", default: "release-screenshots" },
    "no-cache": { type: "boolean", default: false },
    jobs: {
      type: "string",
      default: String(Math.min(4, availableParallelism())),
    },
  },
});
if (!source) {
  console.error(
    "usage: bun scripts/release-screenshots.ts <vX.Y.Z | notes.md> [name…]",
  );
  process.exit(1);
}
const scale = Number(scaleArg);
const RELEASE_TAG = /^v\d/;
const CARBON_ROOT = /^carbon-components-svelte$/;
const CARBON_CSS = /^carbon-components-svelte\/css\//;
const SVELTE_FILE = /\.svelte$/;
const LEADING_DOT = /^\./;

const notes = RELEASE_TAG.test(source)
  ? await $`gh release view ${source} --json body -q .body`.text()
  : await readFile(source, "utf8");
const { snippets, skipped } = extractSnippets(notes);
for (const name of skipped) console.log(`SKIP ${name}: no svelte fence`);
const names = [...snippets.keys()].filter(
  (name) => !wanted.length || wanted.includes(name),
);
if (!names.length) {
  console.error("No markers with a svelte fence found.");
  process.exit(1);
}

// Content-addressed cache: a shot is reused when its snippet, recipe, scale,
// the library (src/ and css/all.css), and this tooling are all unchanged.
const CACHE_DIR = path.resolve("node_modules/.cache/release-screenshots/png");
async function hashFiles(patterns: string[]): Promise<string> {
  const files = patterns.flatMap((pattern) =>
    [...new Glob(pattern).scanSync(".")].sort(),
  );
  const contents = await Promise.all(
    files.map((file) => Bun.file(file).bytes()),
  );
  const hasher = new Bun.CryptoHasher("sha256");
  files.forEach((file, i) => {
    hasher.update(file);
    hasher.update(contents[i]);
  });
  return hasher.digest("hex");
}
const engineHash = await hashFiles([
  "src/**/*.{svelte,js}",
  "css/all.css",
  "scripts/release-screenshots.ts",
  "scripts/lib/release-screenshots.ts",
]);
function cacheKey(name: string): string {
  const { act, ...rest } = recipes[name] ?? {};
  return fingerprint([engineHash, snippets.get(name), scale, rest, `${act}`]);
}
const cachePath = (name: string) =>
  path.join(CACHE_DIR, `${cacheKey(name)}.png`);

await mkdir(out, { recursive: true });
await mkdir(CACHE_DIR, { recursive: true });
const todo: string[] = [];
await Promise.all(
  names.map(async (name) => {
    if (
      !noCache &&
      !recipes[name]?.volatile &&
      (await Bun.file(cachePath(name)).exists())
    ) {
      await copyFile(cachePath(name), path.join(out, `${name}.png`));
      console.log("cached", name);
    } else {
      todo.push(name);
    }
  }),
);
if (!todo.length) process.exit(0);

// Launch Chrome and its views while the bundle builds. `url: false` always
// spawns a fresh Chrome, never attaching to one you have open (which macOS
// prompts to allow).
const views = Promise.all(
  Array.from({ length: Math.min(Number(jobsArg), todo.length) }, async () => {
    const view = new Bun.WebView({
      width: 1200,
      height: 800,
      backend: { type: "chrome", url: false, argv: ["--hide-scrollbars"] },
    });
    await view.navigate("about:blank"); // cdp() needs a session
    return view;
  }),
);
// One bundle; every snippet is a lazy module picked by `?s=`. Generated files
// live under node_modules so `svelte` resolves from the repo.
const genDir = path.resolve("node_modules/.cache/release-screenshots");
await mkdir(genDir, { recursive: true });
await Promise.all(
  todo.map((name) =>
    writeFile(path.join(genDir, `${name}.svelte`), snippets.get(name) ?? ""),
  ),
);
await writeFile(
  path.join(genDir, "entry.ts"),
  `import { mount } from "svelte";
import "carbon-components-svelte/css/all.css";
const mods = { ${todo.map((name) => `${JSON.stringify(name)}: () => import("./${name}.svelte")`).join(",")} };
const name = new URLSearchParams(location.search).get("s")!;
mods[name]().then((m) => mount(m.default, { target: document.getElementById("app")! }));
`,
);
const build = await Bun.build({
  entrypoints: [path.join(genDir, "entry.ts")],
  target: "browser",
  splitting: true,
  conditions: ["svelte", "browser"],
  plugins: [
    {
      name: "svelte",
      setup(builder) {
        builder.onResolve({ filter: CARBON_ROOT }, () => ({
          path: path.resolve("src/index.js"),
        }));
        builder.onResolve({ filter: CARBON_CSS }, (args) => ({
          path: path.resolve("css", args.path.split("/css/")[1]),
        }));
        builder.onLoad({ filter: SVELTE_FILE }, async ({ path: file }) => ({
          contents: compile(await readFile(file, "utf8"), {
            filename: file,
            generate: "client",
            css: "injected",
          }).js.code,
          loader: "js",
        }));
      },
    },
  ],
});
if (!build.success) throw new AggregateError(build.logs);
const files = new Map(
  build.outputs.map((output) => [output.path.replace(LEADING_DOT, ""), output]),
);

const server = Bun.serve({
  port: 0,
  fetch({ url }) {
    const { pathname } = new URL(url);
    if (pathname === "/") {
      return new Response(
        `<!doctype html><meta charset=utf-8><link rel=stylesheet href="/entry.css"><style>body{margin:0;background:#fff}#app{box-sizing:border-box;padding:32px}</style><div id=app></div><script type=module src="/entry.js"></script>`,
        { headers: { "content-type": "text/html" } },
      );
    }
    const file = files.get(pathname);
    return file
      ? new Response(file)
      : new Response("not found", { status: 404 });
  },
});

async function shoot(view: View, name: string) {
  const recipe = { width: 420, ...recipes[name] };
  const viewport = recipe.viewport ?? {
    width: recipe.width + 64,
    height: 600,
  };
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    ...viewport,
    deviceScaleFactor: scale,
    mobile: false,
  });
  await view.navigate(`http://localhost:${server.port}/?s=${name}`);
  await waitFor(view, "#app > *");
  await css(
    view,
    recipe.viewport
      ? "#app{padding:0!important}"
      : `#app{width:${recipe.width}px}`,
  );
  if (recipe.act) {
    await settle(view);
    await recipe.act(view);
  }
  await settle(view);
  // Round the height up, or Chrome crops a CSS pixel off the element.
  const box = recipe.viewport
    ? { x: 0, y: 0, ...viewport }
    : await ev<{ x: number; y: number; width: number; height: number }>(
        view,
        `(() => { const b = document.getElementById("app").getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: Math.ceil(b.height) } })()`,
      );
  const { data } = (await view.cdp("Page.captureScreenshot", {
    format: "png",
    clip: { ...box, scale: 1 },
  })) as { data: string };
  const png = Buffer.from(data, "base64");
  await Bun.write(path.join(out, `${name}.png`), png);
  if (!recipe.volatile) await Bun.write(cachePath(name), png);
  console.log("ok", name);
}

// Each view runs one shot at a time (a view allows one CDP call in flight);
// the views run side by side and pull names off a shared queue.
const openViews = await views;
try {
  const queue = [...todo];
  await Promise.all(
    openViews.map(async (view) => {
      for (let name = queue.shift(); name; name = queue.shift()) {
        // biome-ignore lint/performance/noAwaitInLoops: one shot at a time per view
        await shoot(view, name);
      }
    }),
  );
} finally {
  for (const view of openViews) view.close();
  await server.stop(true);
}
