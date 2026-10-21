import { render, screen } from "@testing-library/svelte";
import { hideAtBreakpoint } from "../../src/Breakpoint/hide-at-breakpoint.js";
import { stubViewport } from "../utils/match-media";
import HideAtBreakpoint from "./HideAtBreakpoint.test.svelte";

const width = { sm: 400, md: 800, lg: 1100, xlg: 1400, max: 1700 };

describe("hideAtBreakpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["xlg", { above: "lg" }, true],
    ["lg", { above: "lg" }, false],
    ["sm", { below: "md" }, true],
    ["md", { below: "md" }, false],
  ] as const)("at %s with %j, hidden is %s", (size, options, hidden) => {
    stubViewport(width[size]);

    render(HideAtBreakpoint, { props: { options } });

    const { display } = getComputedStyle(screen.getByTestId("target"));
    expect(display === "none").toBe(hidden);
  });

  it("supports direct import and updates visibility on option change", () => {
    stubViewport(width.xlg);

    const node = document.createElement("div");
    const { update, destroy } = hideAtBreakpoint(node, { above: "lg" });

    expect(node.style.display).toBe("none");

    update({ above: "xlg" });
    expect(node.style.display).toBe("");

    destroy();
  });
});
