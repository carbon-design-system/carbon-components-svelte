// Type-checks the docs examples against the library's types with
// svelte-typecheck, non-strict, and fails on Svelte compiler errors. Exits
// 1 on any error, except the ones only TypeScript's inference produces (see
// `IGNORED`).
//
//   bun run build:docs   # from the repo root, for the .d.ts files
//   cd docs && bun scripts/typecheck-examples.ts
//
// Framed examples are checked in place. Live examples (markup in a `.svx`
// page) are written, one file per page, to a scratch directory with the
// page's `<script>`, the way the page compiles them.
import fs from "node:fs";
import path from "node:path";
import { compile } from "mdsvex";
import { compilerDiagnostics, typecheck } from "svelte-typecheck";
import { visit } from "unist-util-visit";
import { PAGE_EXTENSION } from "./constants";

const DOCS = path.resolve(import.meta.dirname, "..");
const PAGES = path.join(DOCS, "src/pages");
const ROOT = path.resolve(DOCS, "..");
const OUT = path.join(DOCS, ".cache/typecheck-examples");

const DOC_KBD_RE = /^\s*<DocKbd\b/;
const RELATIVE_IMPORT_RE = /(from\s+|import\s+)(["'])(\.\.?\/[^"']+)\2/g;

/**
 * Errors a JavaScript reader never hits. The examples are plain JS, so
 * TypeScript widens their literals and types DOM events loosely; flagging
 * that would mean annotating every example. Wrong prop names, invalid
 * literal values, and unknown events still fail.
 */
const IGNORED = [
  // `let kind = "red"` widens to `string`, not Tag's `"red" | …`.
  /^Type '(string|number|boolean)(\[\])?' is not assignable to type/,
  // `const headers = [{ key: "name" }]` widens `key` to `string`.
  /^Type '.*\bkey: string\b.*\[\]' is not assignable to type 'readonly DataTableHeader</,
  // `e.target.value`: the target is typed `EventTarget`.
  /^Property '\w+' does not exist on type '(EventTarget|Element)'/,
  // `new Date(a) - new Date(b)`, and `a - b` on a `string | number` cell.
  /^The (left|right)-hand side of an arithmetic operation must be/,
];

/**
 * Library typing gaps that TypeScript users hit too: `[file, message]`.
 * Fix the type, then delete the entry. An entry that no longer matches
 * anything fails the run, so the list only shrinks.
 */
const KNOWN: Array<[file: string, message: RegExp]> = [
  // `sort` gets the union of every cell type, so `new Date(a)` fails.
  ["src/pages/components/DataTable.svx", /^No overload matches this call/],
  // A computed column's `key` isn't a key of `Row`.
  [
    "src/pages/framed/DataTable/DataTableEditableCells.svelte",
    /not assignable to type 'DataTableHeader</,
  ],
  [
    "src/pages/framed/DataTable/DataTableEditableCellsRefreshCells.svelte",
    /not assignable to type 'DataTableHeader</,
  ],
  [
    "src/pages/framed/InlineEdit/InlineEditDataTableCell.svelte",
    /not assignable to type 'DataTableHeader</,
  ],
  // ToolbarSearch's `shouldFilterRows` types the query `number | string`.
  [
    "src/pages/framed/DataTable/DataTableFilterCustom.svelte",
    /'string \| number'/,
  ],
  // DatePicker's `change` detail is `string | { selectedDates, … }`.
  [
    "src/pages/framed/DatePicker/DatePickerErrorHandler.svelte",
    /selectedDates/,
  ],
  // RecursiveList infers `Node` from the first node, not the union.
  ["src/pages/framed/RecursiveList/RecursiveList.svelte", /^Type '\(/],
  ["src/pages/framed/RecursiveList/RecursiveListOrdered.svelte", /^Type '\(/],
  [
    "src/pages/framed/RecursiveList/RecursiveListOrderedNative.svelte",
    /^Type '\(/,
  ],
];
const knownHits = new Set<number>();

type HtmlNode = {
  value: string;
  lang?: string;
  position?: { start: { line: number } };
};

/** Whether the docs' remark plugin renders this `html` node as a live example. */
function isLiveExample(node: HtmlNode) {
  return (
    node.lang !== "svelte" &&
    !node.value.startsWith("<FileSource") &&
    !node.value.startsWith("<script") &&
    !DOC_KBD_RE.test(node.value)
  );
}

/** Line in the generated file → line in the page. */
const lineMaps = new Map<string, number[]>();

async function writePage(svx: string) {
  const source = fs.readFileSync(svx, "utf8");
  const scripts: string[] = [];
  const examples: HtmlNode[] = [];
  await compile(source, {
    smartypants: false,
    highlight: false,
    remarkPlugins: [
      () => (tree: Parameters<typeof visit>[0]) => {
        visit(tree, "html", (node: HtmlNode) => {
          if (node.value.startsWith("<script")) scripts.push(node.value);
          else if (isLiveExample(node)) examples.push(node);
        });
      },
    ],
  });
  if (examples.length === 0) return;

  // Resolve the page's relative imports from the scratch directory.
  const script = scripts
    .join("\n")
    .replace(RELATIVE_IMPORT_RE, (_, keyword, quote, specifier) => {
      const resolved = path.resolve(path.dirname(svx), specifier);
      return `${keyword}${quote}${path.relative(OUT, resolved)}${quote}`;
    });
  const lines = script.split("\n");
  const map: number[] = lines.map(() => 0);
  const hasDocKbd = examples.some((e) => e.value.includes("<DocKbd"));
  if (hasDocKbd && !script.includes("import DocKbd")) {
    const docKbd = path.relative(
      OUT,
      path.join(DOCS, "src/components/DocKbd.svelte"),
    );
    lines.unshift(`<script>import DocKbd from "${docKbd}";</script>`);
    map.unshift(0);
  }
  for (const example of examples) {
    const start = example.position?.start.line ?? 0;
    for (const [i, line] of example.value.split("\n").entries()) {
      lines.push(line);
      map.push(start + i);
    }
  }
  const name = `${path.basename(svx, PAGE_EXTENSION)}.svelte`;
  fs.writeFileSync(path.join(OUT, name), lines.join("\n"));
  lineMaps.set(name, map);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const pages = fs
  .readdirSync(PAGES, { recursive: true, encoding: "utf8" })
  .filter((f) => f.endsWith(PAGE_EXTENSION))
  .map((f) => path.join(PAGES, f));
await Promise.all(pages.map(writePage));

const framedFiles = fs
  .readdirSync(path.join(PAGES, "framed"), {
    recursive: true,
    encoding: "utf8",
  })
  .filter((f) => f.endsWith(".svelte"));

const relative = (p: string) => path.relative(OUT, path.join(DOCS, p));
fs.writeFileSync(
  path.join(OUT, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: false,
        allowJs: true,
        checkJs: true,
        noEmit: true,
        skipLibCheck: true,
        verbatimModuleSyntax: true,
        types: [],
        paths: {
          "carbon-components-svelte": [relative("../src")],
          "carbon-components-svelte/*": [relative("../src/*")],
        },
      },
      include: ["*.svelte", relative("src/pages/framed/**/*.svelte")],
    },
    null,
    2,
  ),
);

const { diagnostics } = await typecheck({
  cwd: ROOT,
  workspace: "docs",
  tsconfig: path.relative(DOCS, path.join(OUT, "tsconfig.json")),
  declarations: false,
  outDir: "docs/.cache/typecheck",
  components: [
    ".cache/typecheck-examples/*.svelte",
    "src/pages/framed/**/*.svelte",
  ],
  checker: "bun",
  diagnosticSources: ["js"],
});

const found: Array<
  [file: string, row: number, column: number, message: string]
> = diagnostics
  .filter((d) => d.severity === "error")
  .map((d) => [
    path.relative(DOCS, d.file),
    d.line,
    d.column,
    d.message.split("\n")[0],
  ]);
// The compiler's errors (not its warnings) fail an example too.
for (const file of [
  ...[...lineMaps.keys()].map((name) => path.join(OUT, name)),
  ...framedFiles.map((f) => path.join(PAGES, "framed", f)),
])
  for (const d of compilerDiagnostics(fs.readFileSync(file, "utf8"), file, {
    cwd: ROOT,
  }))
    if (d.severity === "error")
      found.push([
        path.relative(DOCS, file),
        d.line,
        d.column,
        d.message.split("\n")[0],
      ]);

let errors = 0;
for (const [file, row, column, message] of found) {
  if (IGNORED.some((re) => re.test(message))) continue;
  const map = lineMaps.get(path.basename(file));
  const source = map
    ? `src/pages/components/${path.basename(file, ".svelte")}${PAGE_EXTENSION}`
    : file;
  const known = KNOWN.findIndex(([f, re]) => f === source && re.test(message));
  if (known !== -1) {
    knownHits.add(known);
    continue;
  }
  errors++;
  const location = map
    ? `${source}:${map[row - 1] || "?"}`
    : `${source}:${row}:${column}`;
  console.log(`${location}  ${message}`);
}
for (const [i, [file, re]] of KNOWN.entries()) {
  if (knownHits.has(i)) continue;
  errors++;
  console.log(`${file}  Fixed? Remove its KNOWN entry: ${re}`);
}
const framed = framedFiles.length;
console.log(
  `\nChecked ${lineMaps.size} pages of live examples and ${framed} framed examples: ${errors} errors.`,
);
process.exit(errors > 0 ? 1 : 0);
