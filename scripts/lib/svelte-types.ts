import { relative, sep } from "node:path";
import type { Diagnostic } from "svelte-typecheck";

/** One TypeScript error reported in a component script. */
export type SvelteTypeError = {
  /** Path relative to `src/`. */
  file: string;
  line: number;
  column: number;
  message: string;
};

/** Error count per component, keyed by path relative to `src/`. */
export type Counts = Record<string, number>;

/**
 * The type errors in `.svelte` files, with paths relative to `src`.
 * `.js` files are left out: `test:src-js` checks them under `strict`.
 */
export function svelteErrors(
  diagnostics: Diagnostic[],
  src: string,
): SvelteTypeError[] {
  return diagnostics.flatMap((d) =>
    d.severity === "error" && d.file.endsWith(".svelte")
      ? [
          {
            file: relative(src, d.file).split(sep).join("/"),
            line: d.line,
            column: d.column,
            message: d.message,
          },
        ]
      : [],
  );
}

export function countByFile(errors: SvelteTypeError[]): Counts {
  const counts: Counts = {};
  for (const { file } of errors) counts[file] = (counts[file] ?? 0) + 1;
  return sortKeys(counts);
}

export function sortKeys(counts: Counts): Counts {
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export type Change = { file: string; was: number; now: number };

/**
 * Compares the current counts with the committed baseline. A component
 * with more errors than its baseline, or with errors and no baseline
 * entry, has `regressed`. One with fewer is `improved`, and its baseline
 * entry has to come down with it.
 */
export function compare(
  baseline: Counts,
  current: Counts,
): { regressed: Change[]; improved: Change[] } {
  const files = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  const regressed: Change[] = [];
  const improved: Change[] = [];
  for (const file of [...files].sort()) {
    const was = baseline[file] ?? 0;
    const now = current[file] ?? 0;
    if (now > was) regressed.push({ file, was, now });
    else if (now < was) improved.push({ file, was, now });
  }
  return { regressed, improved };
}
