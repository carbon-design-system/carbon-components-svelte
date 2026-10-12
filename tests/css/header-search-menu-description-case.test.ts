// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("header search menu description", () => {
  it("renders the description as written, without lowercasing it", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const description = rules.filter((r) =>
      r.selector.includes(".bx--header-search-menu-description"),
    );
    expect(description.length).toBeGreaterThan(0);
    for (const rule of description) {
      expect(rule.decls.get("text-transform")).toBeUndefined();
    }
  }, 30_000);
});
