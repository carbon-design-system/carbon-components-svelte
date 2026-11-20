// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import DashboardGrid from "./DashboardGrid.test.svelte";

describe("DashboardGrid (server)", () => {
  const layouts = {
    sm: [
      { id: "a", x: 0, y: 0, w: 4, h: 2 },
      { id: "b", x: 0, y: 2, w: 4, h: 2 },
    ],
    lg: [
      { id: "a", x: 0, y: 0, w: 8, h: 2 },
      { id: "b", x: 8, y: 0, w: 8, h: 2 },
    ],
  };

  // The server writes every breakpoint's cell, and CSS picks one, so the
  // first paint is the final layout at any width.
  it("renders each widget's cell for every breakpoint", () => {
    const { document } = renderSSR(DashboardGrid, {
      cols: { sm: 4, md: 8, lg: 16 },
      layouts,
    });

    expect(
      document.querySelector("[data-testid=a]")?.getAttribute("style"),
    ).toBe(
      "--ccs-dg-sm:1 / 1 / span 2 / span 4;--ccs-dg-md:1 / 1 / span 2 / span 8;",
    );
    expect(
      document.querySelector("[data-testid=b]")?.getAttribute("style"),
    ).toBe(
      "--ccs-dg-sm:3 / 1 / span 2 / span 4;--ccs-dg-md:3 / 1 / span 2 / span 8;--ccs-dg-lg:1 / 9 / span 2 / span 8;",
    );
    const grid = document.querySelector("[data-testid=grid]");
    expect(grid?.getAttribute("style")).toContain(
      "--ccs-dashboard-grid-cols-md:8",
    );
    expect(grid?.getAttribute("style")).toContain(
      "--ccs-dashboard-grid-gap:1rem",
    );
  });

  it("renders the handles, their instructions and the live region", () => {
    const { document } = renderSSR(DashboardGrid);

    const handle = document.querySelector("button[aria-label='Move Alpha']");
    const instructions = handle?.getAttribute("aria-describedby");
    expect(document.getElementById(instructions ?? "")?.textContent).toContain(
      "Press Enter to pick up",
    );
    expect(document.querySelector("[role=status]")?.textContent?.trim()).toBe(
      "",
    );
    expect(
      document.querySelector("button[aria-label='Move Gamma']"),
    ).toBeNull();
  });
});
