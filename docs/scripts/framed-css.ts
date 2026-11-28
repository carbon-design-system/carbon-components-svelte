/**
 * A theme sheet per framed page, trimmed to the components its examples
 * load.
 *
 * Each framed example renders in an iframe, which parses its own copy of
 * the theme sheet: the full one is 1 MB, of which an example uses a few
 * percent, and DataTable's page holds about 50 iframes. carbon-preprocess-
 * svelte's `optimizeCarbonCss` keeps the rules of the components a page's
 * examples import, statically or lazily, and of the `bx--` classes their
 * code names, with every prop's variants: no `content` is passed, so it
 * never prunes by the props a call site passes.
 *
 * The examples of one page share a sheet, so their iframes download it
 * once. Sheets are cached on disk by what they're made of.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { BuildOutput } from "bun";

type Metafile = {
  outputs: Record<
    string,
    {
      entryPoint?: string;
      inputs: Record<string, unknown>;
      imports: { path: string; kind: string }[];
    }
  >;
};

const FRAMED_ENTRY =
  /[\\/]src[\\/]pages[\\/]framed[\\/]([^\\/]+)[\\/][^\\/]+\.svelte$/;
const CLASS_TOKEN = /bx--[\w-]+/g;

export type FramedSheets = {
  /** Root-relative, ending in `/`: a page links `<dir><Page>.css`. */
  dir: string;
};

export async function writeFramedSheets(options: {
  result: BuildOutput;
  outdir: string;
  repo: string;
  cacheDir: string;
  /** The theme sheet to trim, with its Plex URLs already rewritten. */
  carbonCss: string;
  /**
   * Sheets every page needs as they are, appended to each page's, so an
   * iframe loads one sheet.
   */
  shared: string;
}): Promise<FramedSheets> {
  const { result, outdir, repo, cacheDir, carbonCss, shared } = options;
  const metafile = result.metafile as unknown as Metafile;
  const outputs = new Map(
    Object.entries(metafile.outputs).map(([key, output]) => [
      key.replace(/^\.\//, ""),
      output,
    ]),
  );
  const cwd = process.cwd();
  const library = `${path.join(repo, "src")}${path.sep}`;

  // A lazy import into the library, such as a component's lazily loaded
  // part, can render Carbon in the example; one into the docs leads to the
  // framed shell, which reaches every page.
  const isLibrary = (chunk: string) => {
    const entry = outputs.get(chunk)?.entryPoint;
    return entry !== undefined && path.resolve(cwd, entry).startsWith(library);
  };

  // Every chunk an example can load: static imports, and lazy ones into
  // the library.
  const reachable = (start: string, seen: Set<string>) => {
    const stack = [start];
    while (stack.length > 0) {
      const chunk = stack.pop() as string;
      if (seen.has(chunk)) continue;
      seen.add(chunk);
      for (const { path: next, kind } of outputs.get(chunk)?.imports ?? []) {
        const target = next.replace(/^\.\//, "");
        if (!target.endsWith(".js")) continue;
        if (kind === "import-statement" || isLibrary(target))
          stack.push(target);
      }
    }
  };

  const pages = new Map<string, Set<string>>();
  for (const [key, output] of outputs) {
    if (!output.entryPoint || !key.endsWith(".js")) continue;
    const page = FRAMED_ENTRY.exec(path.resolve(cwd, output.entryPoint))?.[1];
    if (!page) continue;
    const chunks = pages.get(page) ?? new Set<string>();
    reachable(key, chunks);
    pages.set(page, chunks);
  }

  const cpsRoot = linkInstalledCarbon(cacheDir, repo);
  const version = JSON.parse(
    fs.readFileSync(
      Bun.resolveSync("carbon-preprocess-svelte/package.json", import.meta.dir),
      "utf8",
    ),
  ).version as string;
  const carbonHash = createHash("sha256").update(carbonCss).digest("hex");
  const tokensByChunk = new Map<string, string[]>();
  const tokensOf = (chunk: string) => {
    let tokens = tokensByChunk.get(chunk);
    if (!tokens) {
      const code = fs.readFileSync(path.join(outdir, chunk), "utf8");
      tokens = [...new Set(Array.from(code.matchAll(CLASS_TOKEN), ([t]) => t))];
      tokensByChunk.set(chunk, tokens);
    }
    return tokens;
  };
  const jobs = [...pages]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, chunks]) => {
      const components = new Set<string>();
      const tokens = new Set<string>();
      for (const chunk of chunks) {
        for (const input of Object.keys(outputs.get(chunk)?.inputs ?? {})) {
          const file = path.resolve(cwd, input);
          // By name: carbon-preprocess-svelte doesn't match a path into
          // the repo to the package it resolved through a link.
          if (file.startsWith(library) && file.endsWith(".svelte")) {
            components.add(path.basename(file, ".svelte"));
          }
        }
        for (const token of tokensOf(chunk)) tokens.add(token);
      }
      const key = createHash("sha256")
        .update(`${version}\0${carbonHash}\0`)
        .update([...components].sort().join("\0"))
        .update("\0")
        .update([...tokens].sort().join("\0"))
        .digest("hex");
      return {
        page,
        key,
        components: [...components],
        safelist: [...tokens],
        cached: path.join(cacheDir, "sheets", `${key}.css`),
      };
    });

  const misses = jobs.filter((job) => !fs.existsSync(job.cached));
  if (misses.length > 0) {
    await trimInWorkers(carbonCss, cpsRoot, misses);
  }
  const sheets = new Map<string, { css: string; key: string }>();
  for (const { page, key, cached } of jobs) {
    sheets.set(page, { css: fs.readFileSync(cached, "utf8"), key });
  }

  // Named by what they're made of, as hashed assets are: production
  // caches /assets/ for a year.
  const hash = createHash("sha256").update(shared);
  for (const [page, { key }] of sheets) hash.update(`${page}\0${key}\0`);
  const dir = `assets/framed-${hash.digest("hex").slice(0, 8)}/`;
  fs.mkdirSync(path.join(outdir, dir), { recursive: true });
  for (const [page, { css }] of sheets) {
    fs.writeFileSync(
      path.join(outdir, dir, `${page}.css`),
      `${css}\n${shared}`,
    );
  }
  return { dir: `/${dir}` };
}

/**
 * carbon-preprocess-svelte reads the installed `carbon-components-svelte`;
 * the docs use the repo's source, so it gets a directory where that's
 * installed as a link to the repo.
 */
function linkInstalledCarbon(cacheDir: string, repo: string): string {
  const root = path.join(cacheDir, "cps-root");
  const link = path.join(root, "node_modules/carbon-components-svelte");
  if (!fs.existsSync(link)) {
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(repo, link, "dir");
  }
  return root;
}

/**
 * Trims a sheet per job, a few at a time: each parses the 1 MB sheet, so
 * a cold build of 124 pages takes minutes on one thread.
 */
async function trimInWorkers(
  carbonCss: string,
  cwd: string,
  jobs: {
    components: string[];
    safelist: string[];
    cached: string;
  }[],
) {
  const size =
    Number(process.env.FRAMED_WORKERS) ||
    Math.min(
      4,
      jobs.length,
      Math.max(1, Math.floor(navigator.hardwareConcurrency / 2)),
    );
  const workers = Array.from(
    { length: size },
    () => new Worker(new URL("./framed-css-worker.ts", import.meta.url)),
  );
  let next = 0;
  await Promise.all(
    workers.map(async (worker) => {
      worker.postMessage({ css: carbonCss });
      while (next < jobs.length) {
        const id = next++;
        const job = jobs[id];
        // eslint-disable-next-line no-await-in-loop -- one job per worker at a time.
        const css = await new Promise<string>((resolve, reject) => {
          worker.onmessage = ({ data }) => resolve(data.css);
          worker.onerror = (event) => reject(event.error ?? event);
          worker.postMessage({
            id,
            components: job.components,
            safelist: job.safelist,
            cwd,
          });
        });
        fs.mkdirSync(path.dirname(job.cached), { recursive: true });
        fs.writeFileSync(`${job.cached}.tmp`, css);
        fs.renameSync(`${job.cached}.tmp`, job.cached);
      }
      worker.terminate();
    }),
  );
}
