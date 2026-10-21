// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// IconIndicator paints every kind with a Carbon v11 status-* token, as v11
// does. A theme or override that re-points a token restyles it.
const ICON_KINDS = [
  ["failed", "status-red"],
  ["caution-major", "status-orange"],
  ["caution-minor", "status-yellow"],
  ["undefined", "status-purple"],
  ["succeeded", "status-green"],
  ["normal", "status-blue"],
  ["in-progress", "status-blue"],
  ["incomplete", "status-blue"],
  ["not-started", "status-gray"],
  ["pending", "status-gray"],
  ["unknown", "status-gray"],
  ["informative", "status-blue"],
] as const;

async function rules(entry: string) {
  const all = parseRules(await compileEntry(entry));
  return {
    find: (selector: string, context = "") =>
      all.find((r) => r.context === context && r.selector === selector)?.decls,
    // The token picks the theme, so no rule re-scopes a kind under one.
    themed: (block: string) =>
      all.filter(
        (r) => r.selector.startsWith("[theme=") && r.selector.includes(block),
      ),
  };
}

describe("indicator status tokens", () => {
  it("reads a status token for every icon kind, in every theme", async () => {
    const { find, themed } = await rules("all.scss");
    for (const [kind, token] of ICON_KINDS) {
      expect(find(`.bx--icon-indicator--${kind}`)?.get("fill"), kind).toBe(
        `var(--cds-${token})`,
      );
    }
    expect(themed(".bx--icon-indicator")).toEqual([]);
  }, 30_000);

  it("keeps the black mark on the caution icons", async () => {
    const { find } = await rules("all.scss");
    for (const kind of ["caution-major", "caution-minor"]) {
      expect(
        find(`.bx--icon-indicator--${kind} path:first-of-type`)?.get("fill"),
      ).toBe("#000000");
    }
  }, 30_000);

  it.each([
    ["white.scss", "#da1e28", "#8a3ffc", "#24a148", "#0043ce", "#6f6f6f"],
    ["g100.scss", "#fa4d56", "#a56eff", "#42be65", "#4589ff", "#8d8d8d"],
  ])(
    "compiles the theme's values into %s",
    async (entry, red, purple, green, blue, gray) => {
      const { find } = await rules(entry);
      const fill = (kind: string) =>
        find(`.bx--icon-indicator--${kind}`)?.get("fill");
      expect(fill("failed")).toBe(red);
      expect(fill("caution-major")).toBe("#ff832b");
      expect(fill("caution-minor")).toBe("#f1c21b");
      expect(fill("undefined")).toBe(purple);
      expect(fill("succeeded")).toBe(green);
      expect(fill("normal")).toBe(blue);
      expect(fill("pending")).toBe(gray);
    },
    60_000,
  );
});
