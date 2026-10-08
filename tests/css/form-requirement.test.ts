// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const SELECTOR = ".bx--form-requirement.bx--form-requirement--invalid";

describe("standalone form requirement", () => {
  it("shows the message Carbon hides until a sibling input is invalid", async () => {
    const rules = parseRules(await compileEntry("all.scss")).filter(
      (r) => r.context === "" && r.selector === SELECTOR,
    );

    expect(
      rules.find((r) => r.decls.has("display"))?.decls.get("display"),
    ).toBe("block");
    expect(rules.find((r) => r.decls.has("color"))?.decls.get("color")).toBe(
      "var(--cds-text-error)",
    );
  }, 30_000);
});
