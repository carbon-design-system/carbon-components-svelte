import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import AreaChart from "./AreaChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/Chart/area-geometry.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/Chart/area-geometry.js")
    >();
  return {
    ...actual,
    buildAreas: (...args: Parameters<typeof actual.buildAreas>) => {
      geometry.calls += 1;
      return actual.buildAreas(...args);
    },
  };
});

const chart = () => screen.getByRole("application", { name: "Sessions" });
const fills = () => document.querySelectorAll(".bx--viz-area__fill");
const yLabels = () =>
  Array.from(
    document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
  ).map((node) => node.textContent);

beforeEach(() => {
  geometry.calls = 0;
});

describe("AreaChart", () => {
  it("draws a translucent layer and a line per series, from zero", () => {
    render(AreaChart);

    expect(fills()).toHaveLength(2);
    expect(document.querySelectorAll(".bx--viz-area__line")).toHaveLength(2);
    expect(fills()[0]).toHaveAttribute("fill-opacity", "0.3");
    expect(yLabels()[0]).toBe("0");
  });

  it("grows the y axis to fit the stack, and restores it", async () => {
    const { rerender } = render(AreaChart);
    expect(yLabels().at(-1)).toBe("50");

    await rerender({ stack: "stacked" });
    expect(Number(yLabels().at(-1))).toBeGreaterThanOrEqual(80);
    expect(fills()[0]).toHaveAttribute("fill-opacity", "0.8");

    await rerender({ stack: "none" });
    expect(yLabels().at(-1)).toBe("50");
  });

  it("shows shares from 0% to 100% when normalized", () => {
    render(AreaChart, { stack: "normalized" });

    expect(yLabels()[0]).toBe("0%");
    expect(yLabels().at(-1)).toBe("100%");
  });

  it("hides the y labels of a stream, which has no baseline", () => {
    render(AreaChart, { stack: "stream" });

    expect(yLabels()).toEqual([]);
    expect(fills()).toHaveLength(2);
  });

  it("restacks when a series is hidden", async () => {
    const { rerender } = render(AreaChart, { stack: "stacked" });

    await rerender({ hidden: ["a"] });
    expect(fills()).toHaveLength(1);
    expect(yLabels().at(-1)).toBe("50");
  });

  it("puts the hover points on the stacked edges without rebuilding layers", async () => {
    render(AreaChart, { stack: "stacked" });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    const dots = Array.from(
      document.querySelectorAll<SVGCircleElement>(
        ".bx--viz-line__point--hover",
      ),
    ).map((dot) => Number(dot.getAttribute("cy")));
    expect(dots).toHaveLength(2);
    // The second series sits on top of the first, so its point is higher.
    expect(dots[1]).toBeLessThan(dots[0]);
    expect(geometry.calls).toBe(built);
  });
});
