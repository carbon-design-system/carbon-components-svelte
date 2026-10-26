// @vitest-environment node
import { compileEntry } from "./compile";

const ROOTS = [".bx--grid-overlay", ".bx--layout-inspector"] as const;

describe("devtools", () => {
  it("ships in devtools.css, not in the theme sheets", async () => {
    const [all, white, devtools] = await Promise.all(
      ["all.scss", "white.scss", "devtools.scss"].map(compileEntry),
    );
    for (const root of ROOTS) {
      expect(all).not.toContain(root);
      expect(white).not.toContain(root);
      expect(devtools).toContain(root);
    }
  }, 30_000);
});
