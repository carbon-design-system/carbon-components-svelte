import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import WaterfallChart from "./WaterfallChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/Chart/waterfall-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/Chart/waterfall-geometry.js")
      >();
    return {
      ...actual,
      buildWaterfall: (...args: Parameters<typeof actual.buildWaterfall>) => {
        geometry.calls += 1;
        return actual.buildWaterfall(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Revenue bridge" });
const bars = () =>
  Array.from(
    document.querySelectorAll<SVGRectElement>(".bx--viz-waterfall__bar"),
  );
const labels = () =>
  Array.from(
    document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
  ).map((node) => node.textContent?.trim());

beforeEach(() => {
  geometry.calls = 0;
});

describe("WaterfallChart", () => {
  it("colors each step by direction and totals neutral", () => {
    render(WaterfallChart);

    expect(
      bars().map((bar) => bar.className.baseVal.match(/bar--(\w+)/)?.[1]),
    ).toEqual(["increase", "increase", "decrease", "total"]);
    expect(
      document.querySelectorAll(".bx--viz-waterfall__connector"),
    ).toHaveLength(3);
  });

  it("sizes the y axis to the running total, not to any one step", async () => {
    const { rerender } = render(WaterfallChart);

    // The peak is 160, past any single step, and nothing dips below zero
    // even though a step is negative.
    expect(Number(labels().at(-1))).toBeGreaterThanOrEqual(160);
    expect(labels()[0]).toBe("0");

    await rerender({
      data: [
        { step: "Start", change: 100 },
        { step: "Refunds", change: -30 },
      ],
      totals: [],
    });
    expect(Number(labels().at(-1))).toBeLessThan(160);
  });

  it("moves step to step, dimming the rest, without rebuilding", async () => {
    render(WaterfallChart);
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.querySelector(".bx--viz-bars__band")).not.toBeNull();
    expect(
      bars().filter(
        (bar) => !bar.classList.contains("bx--viz-bars__bar--dimmed"),
      ),
    ).toHaveLength(1);
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      "Sales",
    );
    expect(geometry.calls).toBe(built);
  });

  it("selects the focused step", async () => {
    const onselect = vi.fn();
    render(WaterfallChart, { onselect });

    chart().focus();
    await user.keyboard("{End}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ index: 3, datum: { step: "End", change: 0 } }),
    );
  });
});
