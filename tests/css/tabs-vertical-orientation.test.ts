// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const MARKER = /\.bx--tabs--vertical(-container)?--(responsive|row|column)\b/;

describe("TabsVertical orientation", () => {
  it("pins each layout with the same rules the breakpoints apply", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const vertical = rules.filter((r) =>
      /\.bx--tabs--vertical\b/.test(r.selector),
    );

    // Breakpoint-scoped layout rules key off the default marker only, so a
    // pinned orientation never picks them up.
    const scoped = vertical.filter((r) => /width/.test(r.context));
    expect(scoped.length).toBeGreaterThan(0);
    for (const rule of scoped) {
      expect(rule.selector).toMatch(/--responsive\b/);
    }

    // The pinned rules are the breakpoint rules, unscoped and re-keyed.
    // Media features minus the breakpoint, so a hover guard nested in a
    // breakpoint matches the same guard at the top level.
    const features = (context: string) =>
      (context.match(/\([^)]*\)/g) ?? [])
        .filter((feature) => !feature.includes("width"))
        .join(" and ");
    const signature = (r: (typeof rules)[number]) =>
      `${features(r.context)}|${r.selector.replace(MARKER, "$ROOT")}|${r.declBlock}`;
    const pinned = (marker: string, bp: RegExp) => {
      const responsive = vertical
        .filter((r) => bp.test(r.context) && /--responsive\b/.test(r.selector))
        .map(signature);
      const pinnedRules = vertical
        .filter((r) => !/width/.test(r.context))
        .filter((r) => r.selector.includes(marker))
        .map(signature);
      return { responsive, pinnedRules };
    };

    const column = pinned("--column", /min-width/);
    expect(column.pinnedRules).toEqual(column.responsive);

    const row = pinned("--row", /max-width/);
    expect(row.pinnedRules).toEqual(row.responsive);
  }, 30_000);
});
