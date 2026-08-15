import { run } from "mitata";

/**
 * `bun run bench/<file>.bench.ts` runs every case in the file.
 * `bun run bench/<file>.bench.ts <pattern>` runs only cases whose *declared*
 * name matches `<pattern>` (a RegExp source, e.g. "flat" or "no cascade") —
 * for fast iteration on one new case in a file with many, instead of the
 * whole file. Matches against the name as written in `bench(...)`, which for
 * a `.range()`/`.args()` case still contains the literal `$size` placeholder
 * (mitata substitutes it per data point only when printing results) — so a
 * match runs *all* range points for that case, not a single size. Filter by
 * something in the case title (function/shape/variant), not a specific size.
 */
export async function runWithFilter(
  opts: Parameters<typeof run>[0] = {},
): Promise<void> {
  const pattern = process.argv[2];
  if (pattern === undefined) {
    await run(opts);
    return;
  }

  let filter: RegExp;
  try {
    // `pattern` is a CLI argument the developer running this script supplies
    // themselves on their own machine — it's the intended filter feature
    // (see the doc comment above), not untrusted/network-facing input
    // reaching a shared process.
    // codeql[js/regex-injection]
    filter = new RegExp(pattern);
  } catch (error) {
    throw new Error(
      `Invalid filter pattern "${pattern}": ${error instanceof Error ? error.message : error}`,
    );
  }

  await run({ ...opts, filter });
}
