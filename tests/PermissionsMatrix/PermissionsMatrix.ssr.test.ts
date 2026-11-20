// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import PermissionsMatrix from "./PermissionsMatrix.test.svelte";

describe("PermissionsMatrix server render", () => {
  it("renders the grid, its headers and every cell state with no window or document", () => {
    const { document } = renderSSR(PermissionsMatrix);

    const grid = document.querySelector('[role="grid"]');
    expect(grid?.getAttribute("aria-rowcount")).toBe("8");
    expect(document.querySelectorAll('[role="columnheader"]')).toHaveLength(4);
    expect(document.querySelectorAll('[role="rowheader"]')).toHaveLength(7);
    expect(document.querySelectorAll('[role="checkbox"]')).toHaveLength(21);

    const states = [...document.querySelectorAll('[role="checkbox"]')].map(
      (c) => c.getAttribute("aria-checked"),
    );
    expect(states).toContain("true");
    expect(states).toContain("mixed");
    expect(
      document.querySelectorAll('[role="checkbox"][tabindex="0"]'),
    ).toHaveLength(1);
  });

  it("paints only the first window of a large virtualized matrix", () => {
    const roles = Array.from({ length: 60 }, (_, i) => ({
      id: `r${i}`,
      label: `Role ${i}`,
    }));
    const permissions = Array.from({ length: 400 }, (_, i) => ({
      id: `p${i}`,
      label: `Permission ${i}`,
    }));
    const { document } = renderSSR(PermissionsMatrix, {
      roles,
      permissions,
      value: {},
      virtualize: true,
      height: 400,
    });

    expect(
      document.querySelector('[role="grid"]')?.getAttribute("aria-colcount"),
    ).toBe("61");
    const painted = document.querySelectorAll('[role="checkbox"]').length;
    expect(painted).toBeGreaterThan(0);
    expect(painted).toBeLessThan(500);
  });
});
