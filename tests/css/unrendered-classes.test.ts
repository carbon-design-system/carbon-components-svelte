// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileEntry } from "./compile";

const SRC_DIR = join(__dirname, "../../src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(svelte|js|ts)$/.test(entry.name) ? [file] : [];
  });
}

// Classes consumers put on their own markup; no component renders them.
const PUBLIC_UTILITIES = new Set([
  "bx--body",
  "bx--no-gutter--start",
  "bx--no-gutter--end",
  "bx--hang--start",
  "bx--hang--end",
  "bx--hang--left",
  "bx--hang--right",
]);

// Styled but never rendered, as found when this check landed. Removing the
// rules behind one means deleting it here; the set only shrinks. A new
// entry means the stylesheet grew a selector nothing can match.
const KNOWN_UNRENDERED = new Set([]);

describe("unrendered classes", () => {
  it("every class in all.css is one a component can render", async () => {
    const css = await compileEntry("all.scss", "compressed");
    const styled = new Set(
      [...css.matchAll(/\.(bx--[\w-]+)/g)].map((match) => match[1]),
    );
    const source = sourceFiles(SRC_DIR)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    const literal = new Set(
      [...source.matchAll(/bx--[\w-]+/g)].map((match) => match[0]),
    );
    // A class built at runtime shows up as a prefix that runs into an
    // interpolation or concatenation: `bx--btn--{kind}`, "bx--col-" + size.
    const dynamicPrefixes = [
      ...new Set(
        [...source.matchAll(/(bx--[\w-]*?--?)(?=\{|\$\{|["'`]\s*\+)/g)].map(
          (match) => match[1],
        ),
      ),
    ];
    const unrendered = [...styled]
      .filter(
        (name) =>
          !literal.has(name) &&
          !PUBLIC_UTILITIES.has(name) &&
          !dynamicPrefixes.some((prefix) => name.startsWith(prefix)),
      )
      .sort();

    // A bare `bx--${x}` would excuse every class in the sheet.
    expect(dynamicPrefixes.filter((prefix) => prefix.length < 8)).toEqual([]);
    // The extraction still works: most classes are written out in src/.
    expect(styled.size).toBeGreaterThan(1000);
    expect(
      [...styled].filter((name) => literal.has(name)).length,
    ).toBeGreaterThan(1000);
    expect(unrendered).toEqual([...KNOWN_UNRENDERED].sort());
  }, 30_000);
});
