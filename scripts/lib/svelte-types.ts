/** One TypeScript error svelte-check reported in a component script. */
export type SvelteTypeError = {
  /** Path relative to `src/`, as svelte-check prints it. */
  file: string;
  line: number;
  column: number;
  message: string;
};

/** Error count per component, keyed by path relative to `src/`. */
export type Counts = Record<string, number>;

const MACHINE_ERROR = /^\d+ ERROR "([^"]+)" (\d+):(\d+) "(.*)"$/;

/**
 * The errors in `.svelte` files from `svelte-check --output machine`.
 * `.js` files are left out: `test:src-js` checks them under `strict`.
 */
export function parseErrors(output: string): SvelteTypeError[] {
  return output.split("\n").flatMap((line) => {
    const match = MACHINE_ERROR.exec(line.trim());
    if (!match?.[1].endsWith(".svelte")) return [];
    const [, file, row, column, message] = match;
    return [
      {
        file,
        line: Number(row),
        column: Number(column),
        message: unescapeMessage(message),
      },
    ];
  });
}

/** svelte-check escapes the message like a JSON string. */
function unescapeMessage(message: string): string {
  try {
    return JSON.parse(`"${message}"`);
  } catch {
    return message;
  }
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
