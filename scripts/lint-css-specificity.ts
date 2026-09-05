/**
 * Ratchet lint for specificity padding in `css/**\/*.scss`.
 *
 * Flags the three ways this codebase has historically out-weighed a Carbon
 * rule instead of editing it:
 *
 *   doubled-class      `.#{$prefix}--x.#{$prefix}--x` / `.bx--x.bx--x`
 *   base-plus-modifier `.#{$prefix}--x.#{$prefix}--x--mod`
 *   element-qualified  `button.#{$prefix}--x`, `a.bx--x`, `li.`, `svg.`...
 *   order-not          `:not(.x)` on a line (or the line above) whose comment
 *                      cites specificity / order / outrank / win / beat
 *
 * A line ending in `// ccs: element` (or `ccs: specificity`) is exempt: the
 * element name (or extra weight) is semantically required and documented.
 *
 * Counts are compared against scripts/css-specificity-baseline.json and the
 * run fails if any category grew. Pass `--update` after lowering a count to
 * write the new floor.
 *
 *   bun scripts/lint-css-specificity.ts
 *   bun scripts/lint-css-specificity.ts --update
 *   bun scripts/lint-css-specificity.ts --list doubled-class
 */
import { readFile, writeFile } from "node:fs/promises";
import { Glob } from "bun";

const BASELINE = "scripts/css-specificity-baseline.json";
const CLASS = String.raw`(?:#\{\$prefix\}|bx)--`;
const ELEMENTS =
  "a|button|li|ul|ol|div|span|svg|input|label|th|td|tr|p|h[1-6]|nav|header|section|textarea|select|fieldset|legend|img|table|thead|tbody";

const PATTERNS: Record<string, RegExp> = {
  "doubled-class": new RegExp(
    String.raw`\.${CLASS}([a-z0-9_-]+)\.${CLASS}\1(?![a-z0-9_-])`,
  ),
  "element-qualified": new RegExp(
    String.raw`(?:^|[\s,>+~(])(?:${ELEMENTS})\.${CLASS}`,
  ),
  // `.bx--x.bx--x--mod`: the block class restated next to its own modifier,
  // which only ever adds weight (the modifier already implies the block).
  "base-plus-modifier": new RegExp(
    String.raw`\.${CLASS}([a-z0-9_-]+)\.${CLASS}\1--[a-z0-9_-]+`,
  ),
};
const ORDER_WORDS = /specific|order|outrank|out-?weigh|\bwin\b|wins|beat|tie/i;
const EXEMPT = /\/\/\s*ccs:\s*(element|specificity)/;
const NOT_CLASS = /:not\(\./;
const TRAILING_COMMENT = /\/\/(.*)$/;

const args = process.argv.slice(2);
const UPDATE = args.includes("--update");
const LIST = args.includes("--list") ? args[args.indexOf("--list") + 1] : null;

type Hit = { file: string; line: number; text: string };
const hits: Record<string, Hit[]> = {
  "doubled-class": [],
  "base-plus-modifier": [],
  "element-qualified": [],
  "order-not": [],
};

const files = Array.from(new Glob("css/**/*.scss").scanSync()).sort();
for (const file of files) {
  // biome-ignore lint/performance/noAwaitInLoops: small file set
  const lines = (await readFile(file, "utf8")).split("\n");
  lines.forEach((text, i) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*")) return;
    if (EXEMPT.test(text)) return;
    for (const [name, re] of Object.entries(PATTERNS)) {
      if (re.test(text)) hits[name].push({ file, line: i + 1, text: trimmed });
    }
    if (NOT_CLASS.test(text)) {
      const prev = lines[i - 1] ?? "";
      const prev2 = lines[i - 2] ?? "";
      const comment = [text, prev, prev2]
        .map((l) => l.match(TRAILING_COMMENT)?.[1] ?? "")
        .join(" ");
      if (ORDER_WORDS.test(comment)) {
        hits["order-not"].push({ file, line: i + 1, text: trimmed });
      }
    }
  });
}

const counts = Object.fromEntries(
  Object.entries(hits).map(([k, v]) => [k, v.length]),
) as Record<string, number>;

if (LIST) {
  for (const h of hits[LIST] ?? [])
    console.log(`${h.file}:${h.line}  ${h.text}`);
  process.exit(0);
}

let baseline: Record<string, number> = {};
try {
  baseline = JSON.parse(await readFile(BASELINE, "utf8"));
} catch {
  if (!UPDATE) {
    console.error(`missing ${BASELINE}; run with --update to create it`);
    process.exit(1);
  }
}

let failed = false;
for (const [name, n] of Object.entries(counts)) {
  const floor = baseline[name];
  const status =
    floor === undefined
      ? "new"
      : n > floor
        ? "GREW"
        : n < floor
          ? "down"
          : "ok";
  if (status === "GREW") failed = true;
  console.log(
    `${name.padEnd(18)} ${String(n).padStart(4)}  baseline ${String(floor ?? "-").padStart(4)}  ${status}`,
  );
}

if (UPDATE) {
  await writeFile(BASELINE, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(`wrote ${BASELINE}`);
} else if (failed) {
  console.error(
    "\nspecificity padding grew; edit the vendored rule in place instead, " +
      "or annotate the line with `// ccs: element` / `// ccs: specificity`.",
  );
  process.exit(1);
} else if (Object.entries(counts).some(([k, n]) => n < (baseline[k] ?? 0))) {
  console.log("\ncounts dropped; run with --update to lower the baseline.");
}
