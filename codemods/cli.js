#!/usr/bin/env node
/**
 * Upgrades an app to a new carbon-components-svelte release.
 *
 *   npx carbon-components-svelte-upgrade                # from the installed version
 *   npx carbon-components-svelte-upgrade 0.114 src      # one release
 *   npx carbon-components-svelte-upgrade --write        # apply
 *
 * Zero dependencies. Markup is parsed with the app's own `svelte/compiler`.
 */
// It reads the app's files, not this repo's. For bivium:
// @depends-on codemods/**
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import {
  NOTE_TITLES as notes0114,
  SUMMARY as summary0114,
  transform as transform0114,
} from "./v0.114/index.js";

/**
 * @typedef {{
 *   transform: (source: string, options: any) => { code: string; notes: { line: number; column: number; kind: string; message: string }[] };
 *   NOTE_TITLES: Record<string, string>;
 *   SUMMARY: string[];
 * }} Codemod
 */

/**
 * Each release's codemod by its `major.minor`, oldest first.
 * @type {Map<string, Codemod>}
 */
const CODEMODS = new Map([
  [
    "0.114",
    {
      transform: transform0114,
      NOTE_TITLES: notes0114,
      SUMMARY: summary0114,
    },
  ],
]);

/** @param {string} version */
const codemod = (version) => /** @type {Codemod} */ (CODEMODS.get(version));

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

const VERSION = /^v?(\d+)\.(\d+)(?:\.\d+)?(?:-[\w.]+)?$/;
const VERSION_IN_RANGE = /(\d+)\.(\d+)(?:\.\d+)?/;
const PACKAGE = "carbon-components-svelte";

const USAGE = `Usage: carbon-components-svelte-upgrade [version] [paths...] [options]

Rewrites an app's code for carbon-components-svelte releases. With no
version, it runs every codemod after the version the app is on: the
installed one, else the one package.json names, else the one it named
at the last commit. Paths default to src. Files in node_modules and dot
folders are skipped.

Versions:
  0.114    Carbon v11 names, light to Layer, DatePicker and CopyInput props

Options:
  --from <version>        Run every codemod after <version>
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
function readOptions(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      from: { type: "string" },
      write: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      "keep-layer-03-color": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const [first, ...rest] = positionals;
  const hasVersion = first !== undefined && VERSION.test(first);
  return {
    version: hasVersion ? first : undefined,
    paths: hasVersion ? rest : positionals,
    from: values.from,
    write: values.write && !values["dry-run"],
    keepLayer03Color: values["keep-layer-03-color"],
    help: values.help,
  };
}

/**
 * `"0.114"` for `0.114`, `v0.114.2` or `^0.114.0`.
 * @param {string | undefined} text
 */
function minorOf(text) {
  const match = text && VERSION_IN_RANGE.exec(text);
  return match ? `${Number(match[1])}.${Number(match[2])}` : undefined;
}

/**
 * @param {string} a
 * @param {string} b
 */
function compareMinor(a, b) {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

/** @param {string} text */
function dependencyVersion(text) {
  try {
    const json = JSON.parse(text);
    for (const field of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
    ]) {
      const range = json[field]?.[PACKAGE];
      if (typeof range === "string") return range;
    }
  } catch {
    // Not JSON.
  }
  return undefined;
}

/**
 * The version the app is on, and where it was read: the installed package,
 * then the range package.json names, then the range it named at the last
 * commit (an install has already bumped the other two). Only a version
 * older than `latest` counts.
 * @param {string} cwd
 * @param {string} latest
 */
function detectVersion(cwd, latest) {
  /** @type {[string, () => string | undefined][]} */
  const sources = [
    [
      "installed",
      () => {
        for (let dir = cwd; ; dir = path.dirname(dir)) {
          const file = path.join(dir, "node_modules", PACKAGE, "package.json");
          if (existsSync(file)) {
            return JSON.parse(readFileSync(file, "utf8")).version;
          }
          if (path.dirname(dir) === dir) return undefined;
        }
      },
    ],
    [
      "package.json",
      () => {
        const file = path.join(cwd, "package.json");
        return existsSync(file)
          ? dependencyVersion(readFileSync(file, "utf8"))
          : undefined;
      },
    ],
    [
      "package.json at HEAD",
      () => {
        const result = spawnSync("git", ["show", "HEAD:./package.json"], {
          cwd,
          encoding: "utf8",
        });
        return result.status === 0
          ? dependencyVersion(result.stdout)
          : undefined;
      },
    ],
  ];
  for (const [source, read] of sources) {
    let version;
    try {
      version = read();
    } catch {
      continue;
    }
    const minor = minorOf(version);
    if (minor && compareMinor(minor, latest) < 0) {
      return { version: /** @type {string} */ (version), minor, source };
    }
  }
  return undefined;
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

/**
 * The codemods to run, oldest first, and a line that says why.
 * @param {ReturnType<typeof readOptions>} options
 * @returns {{ versions: string[]; reason?: string } | { error: string }}
 */
function selectCodemods(options) {
  const available = [...CODEMODS.keys()];
  const latest = /** @type {string} */ (available.at(-1));
  const list = available.join(", ");

  if (options.version) {
    const version = minorOf(options.version);
    if (!version || !CODEMODS.has(version)) {
      return {
        error: `No codemod for ${options.version}. Available: ${list}.`,
      };
    }
    return { versions: [version] };
  }

  /** @param {string} from */
  const after = (from) =>
    available.filter((version) => compareMinor(version, from) > 0);

  if (options.from) {
    const from = minorOf(options.from);
    if (!from) return { error: `Can't read --from ${options.from}.` };
    const versions = after(from);
    if (versions.length === 0) {
      return { error: `No codemod after ${options.from}. Available: ${list}.` };
    }
    return { versions, reason: `Upgrading from ${options.from}` };
  }

  const detected = detectVersion(process.cwd(), latest);
  if (detected) {
    return {
      versions: after(detected.minor),
      reason: `Upgrading from ${detected.version} (${detected.source})`,
    };
  }
  return {
    versions: [latest],
    reason: `Running the ${latest} codemod. Upgrading from an older release? Pass --from <version> to run the codemods after it`,
  };
}

/** @param {string[]} argv */
function main(argv) {
  const options = readOptions(argv);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }
  const selection = selectCodemods(options);
  if ("error" in selection) {
    console.error(selection.error);
    return 1;
  }
  const { versions, reason } = selection;
  if (reason) console.log(dim(`${reason}: ${versions.join(", ")}.\n`));

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
  /** @type {Map<string, Map<string, string[]>>} version, then kind */
  const followUps = new Map(versions.map((version) => [version, new Map()]));
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    let code = source;
    for (const version of versions) {
      const result = codemod(version).transform(code, {
        filename: file,
        parse,
        keepLayer03Color: options.keepLayer03Color,
      });
      const kinds = /** @type {Map<string, string[]>} */ (
        followUps.get(version)
      );
      for (const note of result.notes) {
        if (!kinds.has(note.kind)) kinds.set(note.kind, []);
        kinds
          .get(note.kind)
          ?.push(`${file}:${note.line}:${note.column}  ${note.message}`);
      }
      code = result.code;
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

  const total = [...followUps.values()].reduce(
    (sum, kinds) =>
      sum + [...kinds.values()].reduce((n, lines) => n + lines.length, 0),
    0,
  );
  if (total > 0) {
    const lines =
      versions.length > 1
        ? "line numbers are from before each release's rewrite"
        : "line numbers are from before the rewrite";
    console.log(
      `\n${bold(`Manual follow-ups (${total})`)} ${dim(`(${lines})`)}`,
    );
  }
  for (const [version, kinds] of followUps) {
    const { NOTE_TITLES } = codemod(version);
    const prefix = versions.length > 1 ? `${version}: ` : "";
    for (const [kind, lines] of kinds) {
      console.log(`\n${bold(`${prefix}${NOTE_TITLES[kind] ?? kind}`)}`);
      for (const line of lines) console.log(`  ${line}`);
    }
  }

  for (const version of versions) {
    const { SUMMARY } = codemod(version);
    if (SUMMARY.length === 0) continue;
    console.log(`\n${bold(`Also in ${version}`)}`);
    for (const line of SUMMARY) console.log(`  ${line}`);
  }
  for (const version of versions) {
    console.log(
      `\nSee the migration guide: https://github.com/carbon-design-system/carbon-components-svelte/blob/master/docs/migrations/v${version}.x.md`,
    );
  }
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
