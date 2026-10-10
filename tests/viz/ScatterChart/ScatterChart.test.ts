import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ScatterChart from "./ScatterChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/Chart/point-geometry.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/Chart/point-geometry.js")
    >();
  return {
    ...actual,
    buildPoints: (...args: Parameters<typeof actual.buildPoints>) => {
      geometry.calls += 1;
      return actual.buildPoints(...args);
    },
  };
});

const chart = () =>
  screen.getByRole("application", { name: "Latency against CPU" });
const points = () =>
  Array.from(
    document.querySelectorAll<SVGCircleElement>(".bx--viz-points__point"),
  );
const labels = (side: string) =>
  Array.from(
    document.querySelectorAll(`.bx--viz-axis--${side} .bx--viz-axis__label`),
  ).map((node) => node.textContent?.trim());

beforeEach(() => {
  geometry.calls = 0;
});

describe("ScatterChart", () => {
  it("draws a point per datum on two measured axes, neither forced to zero", () => {
    render(ScatterChart);

    expect(points()).toHaveLength(3);
    expect(points().every((p) => p.getAttribute("r") === "4")).toBe(true);
    // x rounds out to tick values. y starts at the data, not at zero.
    expect(labels("bottom")[0]).toBe("0");
    expect(labels("bottom").at(-1)).toBe("100");
    expect(labels("left")[0]).toBe("100");
  });

  it("sweeps the points in reading order with the keyboard, without rebuilding them", async () => {
    const onhover = vi.fn();
    render(ScatterChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        x: 10,
        points: [expect.objectContaining({ series: "a", index: 0, y: 100 })],
      }),
    );
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 90 }),
    );
    expect(
      points().filter((p) =>
        p.classList.contains("bx--viz-points__point--active"),
      ),
    ).toHaveLength(1);
    expect(
      points().filter((p) =>
        p.classList.contains("bx--viz-points__point--dimmed"),
      ),
    ).toHaveLength(2);
    expect(geometry.calls).toBe(built);

    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("names both measures in the tooltip and announces the point", async () => {
    render(ScatterChart);

    chart().focus();
    await user.keyboard("{End}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("b");
    expect(tooltip).toHaveTextContent(/CPU\s*90/);
    expect(tooltip).toHaveTextContent(/Latency\s*200/);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "90: b 200",
    );
  });

  it("selects the focused point", async () => {
    const onselect = vi.fn();
    render(ScatterChart, { onselect });

    chart().focus();
    await user.keyboard("{Home}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        series: "a",
        index: 0,
        datum: { cpu: 10, latency: 100, tier: "a", cost: 5 },
      }),
    );
  });

  it("becomes a bubble chart with a size, and says the size in the tooltip", async () => {
    render(ScatterChart, { size: "cost" });

    const radii = points().map((p) => Number(p.getAttribute("r")));
    expect(Math.max(...radii)).toBeCloseTo(24);
    expect(Math.min(...radii)).toBeCloseTo(4);
    // Largest first, so small bubbles stay on top.
    expect(radii[0]).toBeGreaterThan(radii[2]);

    chart().focus();
    await user.keyboard("{End}");
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /Cost\s*80/,
    );
  });
});
