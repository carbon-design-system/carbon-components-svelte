/**
 * Strips doc comments from src/**\/*.{js,svelte} for the published package
 * (see scripts/lib/doc-comments.ts). Every rewrite must compile to the same
 * code as the original, comments aside, or the script fails without writing.
 * Run after `build:docs`, which reads the comments.
 *
 *   bun scripts/strip-doc-comments.ts          # verify and report only
 *   bun scripts/strip-doc-comments.ts --write  # verify, then rewrite
 */
import { Glob } from "bun";
import { compile } from "svelte/compiler";
import { stripDocComments, stripSvelteDocComments } from "./lib/doc-comments";

const WRITE = process.argv.includes("--write");
// Minify whitespace: dropping a JSDoc cast such as
// `/** @type {HTMLDivElement} */ (ref)` can make Svelte print an object
// on one line, which changes the layout but not the code.
const transpiler = new Bun.Transpiler({ loader: "js", minifyWhitespace: true });

/** Comment-free, whitespace-free JS for `code`. */
function normalize(code: string): string {
  return transpiler.transformSync(code);
}

function compiled(path: string, code: string): string {
  if (!path.endsWith(".svelte")) return normalize(code);
  const { js, css, warnings } = compile(code, {
    filename: path,
    generate: "client",
  });
  return [
    normalize(js.code),
    css?.code ?? "",
    warnings.map((w) => w.code).join(","),
  ].join("\n");
}

const failures: string[] = [];
let files = 0;
let before = 0;
let after = 0;

for await (const path of new Glob("src/**/*.{js,svelte}").scan()) {
  const code = await Bun.file(path).text();
  const stripped = path.endsWith(".svelte")
    ? stripSvelteDocComments(code)
    : stripDocComments(code);
  before += code.length;
  after += stripped.length;
  if (stripped === code) continue;

  if (compiled(path, code) !== compiled(path, stripped)) {
    failures.push(path);
    continue;
  }
  files++;
  if (WRITE) await Bun.write(path, stripped);
}

console.log(
  `[strip-doc-comments] ${files} files, ${before} -> ${after} B (-${before - after})${WRITE ? "" : " (dry run)"}`,
);

if (failures.length > 0) {
  console.error("  compiled output changed, nothing written for:");
  for (const path of failures) console.error(`  ${path}`);
  process.exit(1);
}
