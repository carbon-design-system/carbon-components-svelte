import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { compileAsync } from "sass-embedded";

export const CSS_DIR = join(__dirname, "../../css");
const CACHE_DIR = join(__dirname, "../../node_modules/.cache/ccs-css-tests");

function scssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return scssFiles(file);
    return entry.name.endsWith(".scss") ? [file] : [];
  });
}

let sourceHash: string | undefined;
function hashSources(): string {
  if (sourceHash) return sourceHash;
  const hash = createHash("sha1");
  for (const file of scssFiles(CSS_DIR).sort())
    hash.update(file).update(readFileSync(file));
  sourceHash = hash.digest("hex").slice(0, 16);
  return sourceHash;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolves true once this worker holds the lock, false when the output
// appeared meanwhile or the lock looks stale and waiting should stop.
async function claim(
  cached: string,
  lock: string,
  waited = 0,
): Promise<boolean> {
  if (existsSync(cached)) return false;
  try {
    mkdirSync(lock);
    return true;
  } catch {
    if (waited > 45_000) return false;
    await sleep(100);
    return claim(cached, lock, waited + 100);
  }
}

/**
 * Compile a theme entry the way the css tests need it. Each test file runs
 * in its own worker, so a dozen of them compiling the same sheet at once is
 * what made this suite slow and its timeouts flaky. Results are cached on
 * disk under a hash of every `.scss` source, and a lock directory lets the
 * first worker compile while the rest wait for its output.
 */
export async function compileEntry(
  entry: string,
  style: "expanded" | "compressed" = "expanded",
): Promise<string> {
  const key = `${hashSources()}-${entry}-${style}`;
  const cached = join(CACHE_DIR, `${key}.css`);
  const lock = join(CACHE_DIR, `${key}.lock`);
  mkdirSync(CACHE_DIR, { recursive: true });

  const owner = await claim(cached, lock);
  if (existsSync(cached)) return readFileSync(cached, "utf8");

  try {
    const { css } = await compileAsync(join(CSS_DIR, entry), {
      style,
      loadPaths: [join(CSS_DIR, "vendor")],
      quietDeps: true,
      silenceDeprecations: [
        "import",
        "global-builtin",
        "color-functions",
        "if-function",
      ],
      logger: { warn() {}, debug() {} },
    });
    const partial = `${cached}.${process.pid}.tmp`;
    writeFileSync(partial, css);
    renameSync(partial, cached);
    return css;
  } finally {
    if (owner) rmSync(lock, { recursive: true, force: true });
  }
}
