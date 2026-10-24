#!/usr/bin/env node
/**
 * Upgrades an app to a new carbon-components-svelte release.
 *
 *   npx carbon-components-svelte-upgrade 0.114 src          # dry run
 *   npx carbon-components-svelte-upgrade 0.114 src --write  # apply
 *
 * Zero dependencies. Markup is parsed with the app's own `svelte/compiler`.
 */
// It reads the app's files, not this repo's. For scripts/lib/test-graph.ts:
// @depends-on codemods/**
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { transform as upgrade0114 } from "./v0.114/index.js";

/** @type {Record<string, typeof upgrade0114>} */
const CODEMODS = { 0.114: upgrade0114 };

const EXTENSIONS = new Set([
  ".svelte",
  ".svx",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".mts",
  ".cts",
  ".css",
  ".scss",
]);

const NOTE_TITLES = {
  token: "v10 tokens to rename by hand",
  theme: "Theme tokens",
  light: "Dynamic `light`",
  flatpickr: "flatpickrProps",
  "layer-03": "layer-03 color change",
  parse: "Files not fully migrated",
};

const VERSION = /^v?(\d+\.\d+)(?:\.\d+)?$/;

const USAGE = `Usage: carbon-components-svelte-upgrade <version> [paths...] [options]

Rewrites an app's code for a carbon-components-svelte release. Paths
default to src. Files in node_modules and dot folders are skipped.

Versions:
  0.114    Carbon v11 names, light to Layer, DatePicker and CopyInput props

Options:
  --dry-run               Print the changes without writing them (default)
  --write                 Write the changes
  --keep-layer-03-color   0.114: rewrite Box and ScrollGradient "layer-03"
                          to "layer-accent", which keeps the 0.113 color
  -h, --help              Show this help`;

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
/** @param {string} code */
const paint = (code) => (/** @type {string} */ text) =>
  useColor ? `\u001b[${code}m${text}\u001b[0m` : text;
const red = paint("31");
const green = paint("32");
const bold = paint("1");
const dim = paint("2");

/** @param {string[]} argv */
function parseArgs(argv) {
  const options = {
    version: "",
    paths: /** @type {string[]} */ ([]),
    write: false,
    keepLayer03Color: false,
    help: false,
  };
  for (const arg of argv) {
    if (arg === "--write") options.write = true;
    else if (arg === "--dry-run") options.write = false;
    else if (arg === "--keep-layer-03-color") options.keepLayer03Color = true;
    else if (arg === "-h" || arg === "--help") options.help = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option ${arg}`);
    else if (options.version) options.paths.push(arg);
    else options.version = arg;
  }
  return options;
}

/**
 * Loads `parse` from the app's Svelte, falling back to one this package can
 * resolve. Returns `undefined` when there is none.
 */
function loadParse() {
  const bases = [path.join(process.cwd(), "package.json"), import.meta.url];
  for (const base of bases) {
    try {
      return createRequire(base)("svelte/compiler").parse;
    } catch {
      // Try the next base.
    }
  }
  return undefined;
}

/**
 * @param {string} target
 * @param {string[]} files
 */
function collectFiles(target, files) {
  const stats = statSync(target);
  if (stats.isFile()) {
    if (EXTENSIONS.has(path.extname(target))) files.push(target);
    return;
  }
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) collectFiles(child, files);
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(child);
  }
}

/**
 * Line hunks between two texts, from a longest common subsequence.
 * @param {string[]} a
 * @param {string[]} b
 */
function diffLines(a, b) {
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail++;
  }
  const left = a.slice(head, a.length - tail);
  const right = b.slice(head, b.length - tail);

  /** @type {{ aStart: number; removed: string[]; bStart: number; added: string[] }[]} */
  const hunks = [];
  if (left.length * right.length > 4_000_000) {
    hunks.push({ aStart: head, removed: left, bStart: head, added: right });
    return hunks;
  }

  const n = left.length;
  const m = right.length;
  const lengths = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lengths[i][j] =
        left[i] === right[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  /** @type {(typeof hunks)[number] | undefined} */
  let hunk;
  while (i < n || j < m) {
    if (i < n && j < m && left[i] === right[j]) {
      hunk = undefined;
      i++;
      j++;
      continue;
    }
    if (!hunk) {
      hunk = { aStart: head + i, removed: [], bStart: head + j, added: [] };
      hunks.push(hunk);
    }
    if (j < m && (i === n || lengths[i][j + 1] >= lengths[i + 1][j])) {
      hunk.added.push(right[j++]);
    } else {
      hunk.removed.push(left[i++]);
    }
  }
  return hunks;
}

/**
 * @param {string} before
 * @param {string} after
 */
function printDiff(before, after) {
  for (const hunk of diffLines(before.split("\n"), after.split("\n"))) {
    for (const [k, line] of hunk.removed.entries()) {
      console.log(red(`${String(hunk.aStart + k + 1).padStart(5)} - ${line}`));
    }
    for (const [k, line] of hunk.added.entries()) {
      console.log(
        green(`${String(hunk.bStart + k + 1).padStart(5)} + ${line}`),
      );
    }
    console.log("");
  }
}

/** @param {string[]} argv */
function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }
  const version = VERSION.exec(options.version)?.[1] ?? options.version;
  const codemod = CODEMODS[version];
  if (!codemod) {
    console.error(
      options.version
        ? `No codemod for ${options.version}. Available: ${Object.keys(CODEMODS).join(", ")}.`
        : USAGE,
    );
    return 1;
  }

  const paths = options.paths.length > 0 ? options.paths : ["src"];
  /** @type {string[]} */
  const files = [];
  for (const target of paths) {
    try {
      collectFiles(target, files);
    } catch {
      console.error(`Can't read ${target}.`);
      return 1;
    }
  }

  const parse = loadParse();
  if (!parse) {
    console.warn(
      "svelte/compiler was not found. Run this from your app's root to migrate component props.\n",
    );
  }

  let changed = 0;
  /** @type {Record<string, string[]>} */
  const followUps = {};
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const { code, notes } = codemod(source, {
      filename: file,
      parse,
      keepLayer03Color: options.keepLayer03Color,
    });
    for (const note of notes) {
      followUps[note.kind] ??= [];
      followUps[note.kind].push(
        `${file}:${note.line}:${note.column}  ${note.message}`,
      );
    }
    if (code === source) continue;
    changed++;
    if (options.write) {
      writeFileSync(file, code);
      console.log(`${green("updated")} ${file}`);
    } else {
      console.log(bold(file));
      printDiff(source, code);
    }
  }

  const count = `${changed} ${changed === 1 ? "file" : "files"}`;
  if (options.write) {
    console.log(`\nUpdated ${count} of ${files.length} checked.`);
  } else {
    console.log(
      `${count} of ${files.length} checked would change. Run again with --write to apply.`,
    );
  }

  const kinds = Object.keys(followUps);
  if (kinds.length > 0) {
    const total = kinds.reduce((sum, kind) => sum + followUps[kind].length, 0);
    console.log(
      `\n${bold(`Manual follow-ups (${total})`)} ${dim("(line numbers are from before the rewrite)")}`,
    );
    for (const kind of kinds) {
      console.log(`\n${bold(NOTE_TITLES[/** @type {"token"} */ (kind)])}`);
      for (const line of followUps[kind]) console.log(`  ${line}`);
    }
  }
  console.log(
    `\nSee the migration guide: https://github.com/carbon-design-system/carbon-components-svelte/blob/master/docs/migrations/v${version}.x.md`,
  );
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
