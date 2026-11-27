// @vitest-environment node
// @depends-on codemods/** tests/scripts/upgrade-0.115/**
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "svelte/compiler";
import { transform } from "../../codemods/v0.115/index.js";

const FIXTURES = fileURLToPath(new URL("./upgrade-0.115/", import.meta.url));

const read = (file: string) =>
  existsSync(path.join(FIXTURES, file))
    ? readFileSync(path.join(FIXTURES, file), "utf8")
    : undefined;

/**
 * Each fixture's input, its expected output (the input when there is no
 * `.output` file) and its notes, one `line:column kind message` per line
 * in `.report.txt` (none when there is no file).
 */
const CASES: {
  name: string;
  ext: string;
  output?: string;
  keepSizes?: boolean;
}[] = [
  { name: "theme-toggle", ext: "svelte" },
  { name: "theme-bound", ext: "svelte" },
  { name: "theme-deep-import", ext: "svelte" },
  { name: "theme-runes", ext: "svelte" },
  { name: "theme-report", ext: "svelte" },
  { name: "deprecated-props", ext: "svelte" },
  { name: "search-menu", ext: "svelte" },
  {
    name: "search-menu",
    ext: "svelte",
    output: "search-menu-keep",
    keepSizes: true,
  },
  { name: "form-fields", ext: "svelte" },
  { name: "report-only", ext: "svelte" },
  { name: "time-and-date", ext: "svelte" },
  { name: "classes", ext: "scss" },
  { name: "link-segments", ext: "svelte" },
  { name: "link-segments-module", ext: "ts" },
  { name: "untouched", ext: "svelte" },
];

describe("upgrade 0.115", () => {
  describe.each(CASES)(
    "$name.$ext",
    ({ name, ext, output = name, keepSizes }) => {
      const input = read(`${name}.input.${ext}.txt`) ?? "";
      const options = { filename: `${name}.${ext}`, parse, keepSizes };
      const result = transform(input, options);

      it("rewrites the file", () => {
        expect(result.code).toBe(read(`${output}.output.${ext}.txt`) ?? input);
      });

      it("reports what it leaves", () => {
        const report = result.notes
          .map(
            (note) =>
              `${note.line}:${note.column} ${note.kind} ${note.message}\n`,
          )
          .join("");
        expect(report).toBe(read(`${output}.report.txt`) ?? "");
      });

      it("changes nothing on a second run", () => {
        expect(transform(result.code, options).code).toBe(result.code);
      });
    },
  );

  it("reports removed classes in scripts, not in .svx code", () => {
    const source =
      'Use `bx--tabs--tall`.\n\n<script>\n  const tall = document.querySelector(".bx--tabs--tall");\n</script>\n';
    const { notes } = transform(source, { filename: "page.svx", parse });
    expect(notes.map((note) => `${note.line} ${note.kind}`)).toEqual([
      "4 classes",
    ]);
  });

  it("reports linkSegments in a script, not in .svx code", () => {
    const source =
      '```js\nimport { linkSegments } from "carbon-components-svelte";\n```\n\n<script>\n  import { linkSegments } from "carbon-components-svelte";\n</script>\n';
    const { notes } = transform(source, { filename: "page.svx", parse });
    expect(notes.map((note) => `${note.line} ${note.kind}`)).toEqual([
      "6 link-segments",
    ]);
  });

  it("says markup was skipped without a Svelte parser", () => {
    const source = `<script>import { SearchMenu } from "carbon-components-svelte";</script>\n<SearchMenu />\n`;
    const { code, notes } = transform(source, {
      filename: "a.svelte",
      keepSizes: true,
    });
    expect(code).toBe(source);
    expect(notes.map((note) => note.kind)).toEqual(["parse"]);
  });
});
