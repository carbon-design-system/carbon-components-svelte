import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import Histogram from "./Histogram.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/Chart/bin-geometry.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/Chart/bin-geometry.js")
    >();
  return {
    ...actual,
    buildBins: (...args: Parameters<typeof actual.buildBins>) => {
      geometry.calls += 1;
      return actual.buildBins(...args);
    },
  };
});

const chart = () => screen.getByRole("application", { name: "Latency" });
const bars = () =>
  Array.from(document.querySelectorAll<SVGRectElement>(".bx--viz-bars__bar"));

beforeEach(() => {
  geometry.calls = 0;
});

describe("Histogram", () => {
  it("counts values into touching bins over a numeric axis from zero", () => {
    render(Histogram);

    // [0, 2) [2, 4) [4, 6) [6, 8) is empty, [8, 10]
    expect(bars()).toHaveLength(4);
    const heights = bars().map((bar) => Number(bar.getAttribute("height")));
    expect(heights[1]).toBeCloseTo(heights[0] * 5);
    const x = bars().map((bar) => Number(bar.getAttribute("x")));
    const width = Number(bars()[0].getAttribute("width"));
    expect(x[1] - x[0]).toBeCloseTo(width + 1);

    const labels = Array.from(
      document.querySelectorAll(".bx--viz-axis--bottom .bx--viz-axis__label"),
    ).map((node) => node.textContent?.trim());
    expect(labels[0]).toBe("0");
    expect(labels.at(-1)).toBe("10");
    expect(
      document.querySelector(".bx--viz-axis--bottom .bx--viz-axis__title"),
    ).toHaveTextContent("Milliseconds");
  });

  it("takes bins counted elsewhere", () => {
    render(Histogram, {
      bins: [
        { x0: 0, x1: 5, count: 3 },
        { x0: 5, x1: 10, count: 6 },
      ],
    });

    expect(bars()).toHaveLength(2);
  });

  it("labels the focused bin with its range, without rebuilding the bins", async () => {
    render(Histogram);
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("2–4");
    expect(tooltip).toHaveTextContent("Count");
    expect(tooltip).toHaveTextContent("5");
    expect(
      bars().filter(
        (bar) => !bar.classList.contains("bx--viz-bars__bar--dimmed"),
      ),
    ).toHaveLength(1);
    expect(geometry.calls).toBe(built);
  });

  it("selects the focused bin", async () => {
    const onselect = vi.fn();
    render(Histogram, { onselect });

    chart().focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        datum: { x0: 0, x1: 2, x: 1, count: 1 },
        index: 0,
      }),
    );
  });

  it("draws a labelled rule for each marker inside the range", () => {
    render(Histogram, {
      markers: [{ x: 3, label: "p50" }, { x: 8.5, label: "p95" }, { x: 99 }],
    });

    expect(
      Array.from(document.querySelectorAll(".bx--viz-marker__label")).map(
        (node) => node.textContent?.trim(),
      ),
    ).toEqual(["p50", "p95"]);
    expect(document.querySelectorAll(".bx--viz-marker__line")).toHaveLength(2);
  });
});
