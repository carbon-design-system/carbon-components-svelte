import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import BarChart from "./BarChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/Chart/bar-geometry.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/Chart/bar-geometry.js")
    >();
  return {
    ...actual,
    buildBars: (...args: Parameters<typeof actual.buildBars>) => {
      geometry.calls += 1;
      return actual.buildBars(...args);
    },
  };
});

const chart = () =>
  screen.getByRole("application", { name: "Revenue by quarter" });
const bars = () =>
  Array.from(document.querySelectorAll<SVGRectElement>(".bx--viz-bars__bar"));
const labels = (side: string) =>
  Array.from(
    document.querySelectorAll(`.bx--viz-axis--${side} .bx--viz-axis__label`),
  ).map((node) => node.textContent);

beforeEach(() => {
  geometry.calls = 0;
});

describe("BarChart", () => {
  it("draws one bar per datum over a categorical axis that starts at zero", () => {
    render(BarChart);

    expect(bars()).toHaveLength(6);
    expect(labels("bottom")).toEqual(["Q1", "Q2", "Q3"]);
    expect(labels("left")[0]).toBe("0");
  });

  it("gives dates their own slots, labelled by their spacing", () => {
    render(BarChart, {
      data: [0, 1, 2].map((month) => ({
        quarter: new Date(2026, month, 1),
        product: "a",
        revenue: 10 + month,
      })),
    });

    expect(labels("bottom")).toEqual(["Jan", "Feb", "Mar"]);
    expect(bars()).toHaveLength(3);
  });

  it("stacks series and grows the y axis to fit the piles", async () => {
    const { rerender } = render(BarChart);
    expect(labels("left").at(-1)).toBe("50");

    await rerender({ mode: "stacked" });
    expect(Number(labels("left").at(-1))).toBeGreaterThanOrEqual(80);
    const [a1, , , b1] = bars();
    expect(a1.getAttribute("x")).toBe(b1.getAttribute("x"));

    await rerender({ mode: "grouped" });
    expect(labels("left").at(-1)).toBe("50");
  });

  it("shows shares from 0% to 100% when normalized", () => {
    render(BarChart, { mode: "normalized" });

    expect(labels("left")[0]).toBe("0%");
    expect(labels("left").at(-1)).toBe("100%");
  });

  it("regroups when a series is hidden", async () => {
    const { rerender } = render(BarChart);
    const wide = Number(bars()[0].getAttribute("width"));

    await rerender({ hidden: ["b"] });
    expect(bars()).toHaveLength(3);
    expect(Number(bars()[0].getAttribute("width"))).toBeGreaterThanOrEqual(
      wide,
    );
  });

  it("moves slot to slot with the keyboard, dimming the rest, without rebuilding bars", async () => {
    render(BarChart);
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.querySelector(".bx--viz-bars__band")).not.toBeNull();
    expect(
      bars().filter(
        (bar) => !bar.classList.contains("bx--viz-bars__bar--dimmed"),
      ),
    ).toHaveLength(2);
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      "Q2",
    );
    expect(geometry.calls).toBe(built);
  });

  it("selects the focused datum", async () => {
    const onselect = vi.fn();
    render(BarChart, { onselect });

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowDown}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        series: "b",
        index: 0,
        datum: { quarter: "Q1", product: "b", revenue: 30 },
      }),
    );
  });
});
