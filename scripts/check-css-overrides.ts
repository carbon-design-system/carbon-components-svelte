/**
 * Lists declarations in a compiled css entry that can never win the cascade
 * (see scripts/lib/css-overrides.ts), attributed to their scss source through
 * the sass source map. Exits non-zero when any exist.
 *
 *   bun scripts/check-css-overrides.ts
 *   bun scripts/check-css-overrides.ts --entry white
 */
import { initAsyncCompiler } from "sass-embedded";
import { SourceMapConsumer } from "source-map-js";
import { deadDeclarations } from "./lib/css-overrides";

const args = process.argv.slice(2);
const entryFlag = args.indexOf("--entry");
const ENTRY =
  entryFlag >= 0 && args[entryFlag + 1] ? args[entryFlag + 1] : "all";

const compiler = await initAsyncCompiler();
const { css, sourceMap } = await compiler
  .compileAsync(`css/${ENTRY}.scss`, {
    style: "expanded",
    sourceMap: true,
    loadPaths: ["css/vendor"],
    quietDeps: true,
    silenceDeprecations: [
      "import",
      "global-builtin",
      "color-functions",
      "if-function",
    ],
  })
  .finally(() => compiler.dispose());

const map = new SourceMapConsumer(
  sourceMap as ConstructorParameters<typeof SourceMapConsumer>[0],
);
const sourceOf = (loc?: { line: number; column: number }): string => {
  if (!loc) return "?";
  const { source, line } = map.originalPositionFor(loc);
  if (!source) return "?";
  const file = decodeURIComponent(new URL(source).pathname);
  return `${file.slice(file.indexOf("/css/") + 1)}:${line}`;
};

const dead = deadDeclarations(css, true);
for (const d of dead) {
  const context = d.context ? `${d.context} ` : "";
  console.log(
    `${sourceOf(d.loc)}\n  ${context}${d.selector}\n  ${d.property}: ${d.value}  <-  ${d.by.property}: ${d.by.value}${d.by.sameRule ? " (same rule)" : ""}`,
  );
}
const bytes = dead.reduce(
  (n, d) => n + d.property.length + d.value.length + 2,
  0,
);
console.log(
  `\n${dead.length} dead declaration(s), ~${bytes} bytes in css/${ENTRY}.css`,
);
if (dead.length > 0) process.exit(1);
