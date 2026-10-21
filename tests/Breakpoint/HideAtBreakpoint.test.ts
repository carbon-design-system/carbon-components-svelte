import { render, screen } from "@testing-library/svelte";
import { hideAtBreakpoint } from "../../src/Breakpoint/hide-at-breakpoint.js";
import { stubViewport } from "../utils/match-media";
import HideAtBreakpoint from "./HideAtBreakpoint.test.svelte";

const width = { sm: 400, md: 800, lg: 1100, xlg: 1400, max: 1700 };

function stubMatchMediaForSize(size: keyof typeof width) {
  stubViewport(width[size]);
}

describe("hideAtBreakpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides content above the `above` bound", () => {
    stubMatchMediaForSize("xlg");

    render(HideAtBreakpoint, { props: { options: { above: "lg" } } });

    expect(screen.getByTestId("target")).toHaveStyle({ display: "none" });
  });

  it("does not hide at the `above` boundary itself", () => {
    stubMatchMediaForSize("lg");

    render(HideAtBreakpoint, { props: { options: { above: "lg" } } });

    expect(screen.getByTestId("target")).not.toHaveStyle({
      display: "none",
    });
  });

  it("hides content below the `below` bound", () => {
    stubMatchMediaForSize("sm");

    render(HideAtBreakpoint, { props: { options: { below: "md" } } });

    expect(screen.getByTestId("target")).toHaveStyle({ display: "none" });
  });

  it("does not hide at the `below` boundary itself", () => {
    stubMatchMediaForSize("md");

    render(HideAtBreakpoint, { props: { options: { below: "md" } } });

    expect(screen.getByTestId("target")).not.toHaveStyle({
      display: "none",
    });
  });

  it("supports direct import and updates visibility on option change", () => {
    stubMatchMediaForSize("xlg");

    const node = document.createElement("div");
    const { update, destroy } = hideAtBreakpoint(node, { above: "lg" });

    expect(node.style.display).toBe("none");

    update({ above: "xlg" });
    expect(node.style.display).toBe("");

    destroy();
  });
});
