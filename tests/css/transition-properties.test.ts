// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// `transition` with no property (a bare duration) or with `all` animates
// every property, including the outline or box-shadow that draws a focus
// ring, so the ring fades in instead of snapping. The conventions test
// checks hand-authored source; this checks the compiled sheet, which also
// covers untouched vendored rules.
describe("transition properties", () => {
  it("every transition names its properties", async () => {
    const offenders = parseRules(await compileEntry("all.scss")).flatMap(
      (rule) =>
        ["transition", "transition-property"].flatMap((prop) => {
          const value = rule.decls.get(prop);
          if (!value) return [];
          const unnamed = value
            .split(/,(?![^(]*\))/)
            .map((part) => part.trim().split(/\s+/)[0])
            .some(
              (first) =>
                first === "all" ||
                (prop === "transition" &&
                  /^(?:[\d.]|var\(|cubic-bezier)/.test(first)),
            );
          return unnamed ? [`${rule.selector} { ${prop}: ${value} }`] : [];
        }),
    );
    expect(offenders).toEqual([]);
  }, 30_000);
});
