// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const GUARD =
  /:where\(:not\(\[class\*="?bx--"?\]\):not\(\.bx--prose \[class\*="?bx--"?\]:not\(\.bx--prose\) \*\)\)/;

describe("prose", () => {
  it("guards every element rule against Carbon elements and their descendants, at zero specificity", async () => {
    const selectors = parseRules(await compileEntry("all.scss"))
      .map((r) => r.selector)
      .filter((s) => s.includes("bx--prose"));
    const elementRules = selectors.filter(
      (s) =>
        // The root, its variants, and the root's rhythm rules space every
        // child, components included.
        !/^\.bx--prose(--\w+)?$/.test(s) &&
        !/^\.bx--prose>(\*\+\*|\*\+(h\d|section|article)|h\d\+\*)$/.test(s) &&
        // Prose's own classes, such as the heading anchor.
        !s.includes("bx--prose__"),
    );

    expect(elementRules.length).toBeGreaterThan(20);
    for (const selector of elementRules) {
      expect(selector, selector).toMatch(GUARD);
    }
  }, 30_000);
});
