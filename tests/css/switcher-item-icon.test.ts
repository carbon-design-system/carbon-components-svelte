// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("switcher item icon", () => {
  it("lines the icon up with the first line of a wrapped label", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const icon = rules.find((r) => r.selector === ".bx--switcher__item-icon");
    const link = rules.find(
      (r) =>
        r.selector === ".bx--switcher__item-link" && r.decls.has("padding"),
    );

    // One line tall (18px line-height at 14px) and pinned to the top.
    expect(icon?.decls.get("align-self")).toBe("flex-start");
    expect(icon?.decls.get("height")).toBe("1.28572em");
    // 7px + 18px + 7px fills the 32px row, so a single line also sits at
    // the top of the content box, level with a wrapped label's first line.
    expect(link?.decls.get("padding")).toMatch(/^0\.4375rem /);
  }, 30_000);
});
