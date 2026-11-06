/**
 * Formats code with `bun fmt`, which has no JavaScript API. Calls made
 * within a few milliseconds of each other are written to a temporary
 * directory and formatted in one run, so formatting a page's examples,
 * or a build's, starts one process rather than one per example.
 *
 * It runs outside the repository with `--no-config`, so the repository's
 * `[fmt]` settings (sorted imports, ignored Markdown) don't apply: the
 * output is Prettier's defaults plus `flags`.
 */
import { execFileSync, spawn } from "node:child_process";
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

export function createFormatter(
  extension: string,
  flags: string[] = [],
  delay = 5,
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
          fs.promises.writeFile(path.join(dir, `${i}.${extension}`), source),
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
            resolve(
              await fs.promises.readFile(
                path.join(dir, `${i}.${extension}`),
                "utf8",
              ),
            );
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

/** Runs `bun` with `args` in `cwd`; resolves with its stderr. */
function run(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", args, {
      cwd,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    // Exit code 2 means some files didn't parse; they're named in stderr.
    child.on("close", (code) =>
      code === 0 || code === 2
        ? resolve(stderr)
        : reject(new Error(`bun fmt exited with ${code}:\n${stderr}`)),
    );
  });
}

/** The `bun fmt` version, for caches keyed on the formatter. */
export function formatterVersion(): string {
  return `bun ${execFileSync("bun", ["--version"], { encoding: "utf8" }).trim()}`;
}
