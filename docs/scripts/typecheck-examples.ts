// Type-checks the docs examples against the library's types with
// svelte-check, non-strict. Exits 1 on any error.
//
//   bun run build:docs   # from the repo root, for the .d.ts files
//   cd docs && bun scripts/typecheck-examples.ts
//
// Framed examples are checked in place. Live examples (markup in a `.svx`
// page) are written, one file per page, to a scratch directory with the
// page's `<script>`, the way the page compiles them.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { compile } from "mdsvex";
import { visit } from "unist-util-visit";

const DOCS = path.resolve(import.meta.dirname, "..");
const PAGES = path.join(DOCS, "src/pages");
const OUT = path.join(DOCS, ".cache/typecheck-examples");
const SVELTE_CHECK = path.join(DOCS, "../node_modules/.bin/svelte-check");

const DOC_KBD_RE = /^\s*<DocKbd\b/;
const RELATIVE_IMPORT_RE = /(from\s+|import\s+)(["'])(\.\.?\/[^"']+)\2/g;

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
  const name = `${path.basename(svx, ".svx")}.svelte`;
  fs.writeFileSync(path.join(OUT, name), lines.join("\n"));
  lineMaps.set(name, map);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const pages = fs
  .readdirSync(PAGES, { recursive: true, encoding: "utf8" })
  .filter((f) => f.endsWith(".svx"))
  .map((f) => path.join(PAGES, f));
await Promise.all(pages.map(writePage));

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

const check = spawnSync(
  SVELTE_CHECK,
  [
    "--workspace",
    OUT,
    "--tsconfig",
    path.join(OUT, "tsconfig.json"),
    "--output",
    "machine",
    "--diagnostic-sources",
    "js,svelte",
    "--threshold",
    "error",
  ],
  { cwd: OUT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

// `<timestamp> ERROR "<file>" <line>:<column> "<message>"`
const ERROR_RE = /^\d+ ERROR "(.+?)" (\d+):(\d+) "(.*)"$/;
let errors = 0;
for (const line of check.stdout.split("\n")) {
  const match = line.match(ERROR_RE);
  if (!match) continue;
  errors++;
  const [, file, row, column, message] = match;
  const map = lineMaps.get(file);
  const location = map
    ? `src/pages/components/${file.replace(".svelte", ".svx")}:${map[Number(row) - 1] || "?"}`
    : `${path.relative(DOCS, path.resolve(OUT, file))}:${row}:${column}`;
  console.log(`${location}  ${JSON.parse(`"${message}"`).split("\n")[0]}`);
}
if (check.status !== 0 && errors === 0) {
  console.error(check.stdout, check.stderr);
  process.exit(check.status ?? 1);
}
const framed = fs
  .readdirSync(path.join(PAGES, "framed"), {
    recursive: true,
    encoding: "utf8",
  })
  .filter((f) => f.endsWith(".svelte")).length;
console.log(
  `\nChecked ${lineMaps.size} pages of live examples and ${framed} framed examples: ${errors} errors.`,
);
process.exit(errors > 0 ? 1 : 0);
