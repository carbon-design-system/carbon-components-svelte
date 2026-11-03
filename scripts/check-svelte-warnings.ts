import { join, relative } from "node:path";
import { compilerDiagnostics } from "./lib/svelte-warnings";

/**
 * Compiles every component in `src/` without generating code and fails on
 * any warning or error the Svelte compiler reports: a11y, unused CSS,
 * invalid markup. `<!-- svelte-ignore code -->` silences a warning.
 *
 *   bun run test:src-svelte
 */
const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");

const files = [...new Bun.Glob("**/*.svelte").scanSync({ cwd: SRC })].filter(
  (rel) => !rel.includes("node_modules"),
);
const sources = await Promise.all(
  files.map((rel) => Bun.file(join(SRC, rel)).text()),
);

let count = 0;
files.forEach((rel, i) => {
  const path = join(SRC, rel);
  for (const d of compilerDiagnostics(sources[i], relative(ROOT, path))) {
    count++;
    console.error(
      `${relative(ROOT, path)}:${d.line}:${d.column} - ${d.severity} ${d.code}: ${d.message}`,
    );
  }
});

console.log(
  `${files.length} components, ${count} compiler warnings or errors.`,
);
process.exit(count ? 1 : 0);
