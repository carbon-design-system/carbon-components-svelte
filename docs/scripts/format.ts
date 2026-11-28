/**
 * `bun fmt` has no JavaScript API, so calls made close together share one
 * process. It runs with `--no-config`, so the repo's `[fmt]` settings don't
 * apply. Results are cached on disk, keyed by the formatter's version, the
 * language, the flags and the source, so a build formats only what changed.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Pending = {
  source: string;
  resolve: (formatted: string) => void;
  reject: (error: Error) => void;
};

/** Lines like `    at 12.svelte:1:7` name a file `bun fmt` couldn't format. */
const FAILED_FILE_RE = /^\s+at (\d+)\.[a-z]+:\d+:\d+$/gm;

const CACHE_DIR = path.join(
  import.meta.dir,
  "../node_modules/.cache/ccs-docs-format",
);

export function createFormatter(
  extension: string,
  flags: string[] = [],
  delay = 5,
): (source: string) => Promise<string> {
  const queue = batchedFormatter(extension, flags, delay);
  const salt = `${formatterVersion()}\0${extension}\0${flags.join(" ")}\0`;
  const memo = new Map<string, Promise<string>>();

  async function cached(source: string): Promise<string> {
    const key = new Bun.CryptoHasher("sha256")
      .update(salt)
      .update(source)
      .digest("hex");
    const file = path.join(CACHE_DIR, `${key}.${extension}`);
    const hit = Bun.file(file);
    if (await hit.exists()) return hit.text();
    const formatted = await queue(source);
    // Through a temporary file, so a parallel build never reads half of one.
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
    await Bun.write(tmp, formatted);
    await fs.promises.rename(tmp, file);
    return formatted;
  }

  return (source) => {
    let result = memo.get(source);
    if (!result) {
      result = cached(source);
      memo.set(source, result);
    }
    return result;
  };
}

function batchedFormatter(
  extension: string,
  flags: string[],
  delay: number,
): (source: string) => Promise<string> {
  let pending: Pending[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function flush() {
    const batch = pending;
    pending = [];
    timer = undefined;
    const dir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "ccs-docs-fmt-"),
    );
    try {
      await Promise.all(
        batch.map(({ source }, i) =>
          Bun.write(path.join(dir, `${i}.${extension}`), source),
        ),
      );
      const stderr = await run(["fmt", "--no-config", ...flags, "."], dir);
      const failed = new Set(
        Array.from(stderr.matchAll(FAILED_FILE_RE), ([, i]) => Number(i)),
      );
      await Promise.all(
        batch.map(async ({ resolve, reject }, i) => {
          if (failed.has(i)) {
            reject(new Error(`bun fmt couldn't format the code:\n${stderr}`));
          } else {
            resolve(await Bun.file(path.join(dir, `${i}.${extension}`)).text());
          }
        }),
      );
    } catch (error) {
      for (const { reject } of batch) reject(error as Error);
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }

  return (source) =>
    new Promise((resolve, reject) => {
      pending.push({ source, resolve, reject });
      timer ??= setTimeout(flush, delay);
    });
}

/** Runs this same `bun`, so `formatterVersion` names the formatter used. */
async function run(args: string[], cwd: string): Promise<string> {
  const child = Bun.spawn([process.execPath, ...args], {
    cwd,
    stdio: ["ignore", "ignore", "pipe"],
  });
  const [stderr, code] = await Promise.all([
    new Response(child.stderr).text(),
    child.exited,
  ]);
  // Exit code 2 means some files didn't parse; they're named in stderr.
  if (code === 0 || code === 2) return stderr;
  throw new Error(`bun fmt exited with ${code}:\n${stderr}`);
}

/** The `bun fmt` version, for caches keyed on the formatter. */
export function formatterVersion(): string {
  return `bun ${Bun.version}`;
}
