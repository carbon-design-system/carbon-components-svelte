// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("toggletip content type", () => {
  it("keeps a bare paragraph in the content's type style", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    // all.css styles `p` itself (body-02), which would beat inheritance.
    const reset = rules.find(
      (r) => r.selector === ".bx--toggletip-content p:not([class])",
    );
    expect(reset?.decls.get("font")).toBe("inherit");
    expect(reset?.decls.get("letter-spacing")).toBe("inherit");
    expect(reset?.decls.get("margin")).toBe("0");
  }, 30_000);
});
