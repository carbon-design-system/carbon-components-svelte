// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const TRIGGER = ".bx--tooltip__trigger.bx--tooltip__trigger--definition";

describe("tooltip definition trigger color", () => {
  // The trigger is a <button>, so without a color it takes the UA
  // `buttontext` color and ignores theme tokens.
  it("sets the trigger text to the primary text token", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const trigger = rules.filter(
      (r) => r.selector === TRIGGER && r.context === "",
    );
    expect(
      trigger.some((r) => r.decls.get("color")?.includes("--cds-text-primary")),
    ).toBe(true);
  }, 30_000);

  // A truncating Tag wraps its label in the trigger; the label keeps the
  // tag's own text color.
  it("inherits the tag's text color inside a Tag", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    for (const host of [".bx--tag__label-tooltip", ".bx--tag-set-overflow"]) {
      const rule = rules.find((r) => r.selector === `${host} ${TRIGGER}`);
      expect(rule?.decls.get("color")).toBe("inherit");
    }
  }, 30_000);
});
