// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// Server-rendered markup has a side nav that is neither `--expanded` nor
// `--collapsed` until JS measures the window. These rules lay `Content` out
// as hydration will, so it doesn't move across once JS runs.
describe("UI shell before hydration", () => {
  async function rules() {
    return parseRules(await compileEntry("all.scss"));
  }

  it("lays content out beside an open side nav on large screens", async () => {
    const rule = (await rules()).find(
      (r) =>
        r.context.includes("min-width:66rem") &&
        r.selector ===
          ".bx--side-nav:not(.bx--side-nav--collapsed):not(.bx--side-nav--rail)~.bx--content",
    );
    expect(rule?.decls.get("margin-left")).toBe(
      "var(--ccs-side-nav-width,16rem)",
    );
  }, 30_000);

  it("starts content at the edge below lg, keeping a rail's or fixed nav's margin", async () => {
    const rule = (await rules()).find(
      (r) =>
        r.context.includes("max-width:65.98rem") &&
        r.selector ===
          ".bx--side-nav:not(.bx--side-nav--rail):not(.bx--side-nav--fixed)~.bx--content",
    );
    expect(rule?.decls.get("margin-left")).toBe("0");
  }, 30_000);

  it("keeps content beside a nav expanded below lg", async () => {
    const rule = (await rules()).find(
      (r) =>
        r.context.includes("max-width:65.98rem") &&
        r.selector ===
          ".bx--side-nav.bx--side-nav--expanded:not(.bx--side-nav--rail):not(.bx--side-nav--fixed)~.bx--content",
    );
    expect(rule?.decls.get("margin-left")).toBe(
      "var(--ccs-side-nav-width,16rem)",
    );
  }, 30_000);

  it("draws a resizable side nav at its width on large screens", async () => {
    const rule = (await rules()).find(
      (r) =>
        r.context.includes("min-width:66rem") &&
        r.selector ===
          ".bx--side-nav--resizable:not(.bx--side-nav--collapsed):not(.bx--side-nav--rail)",
    );
    expect(rule?.decls.get("width")).toBe("var(--ccs-side-nav-width,16rem)");
  }, 30_000);
});
