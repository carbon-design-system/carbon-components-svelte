import { render, screen } from "@testing-library/svelte";
import { hideAtBreakpoint } from "../../src/Breakpoint/hideAtBreakpoint.js";
import HideAtBreakpoint from "./HideAtBreakpoint.test.svelte";

type Size = "sm" | "md" | "lg" | "xlg" | "max";

function stubMatchMediaForSize(size: Size) {
  const isMatch: Record<Size, (query: string) => boolean> = {
    sm: (query) => query.includes("(max-width: 672px)"),
    md: (query) => query.includes("(min-width: 672px) and (max-width: 1056px)"),
    lg: (query) =>
      query.includes("(min-width: 1056px) and (max-width: 1312px)"),
    xlg: (query) =>
      query.includes("(min-width: 1312px) and (max-width: 1584px)"),
    max: (query) => query.includes("(min-width: 1584px)"),
  };

  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isMatch[size](query),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("hideAtBreakpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders children when outside the hidden range", () => {
    stubMatchMediaForSize("lg");

    render(HideAtBreakpoint, { props: { options: { above: "xlg" } } });

    expect(screen.getByTestId("target")).not.toHaveStyle({
      display: "none",
    });
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
