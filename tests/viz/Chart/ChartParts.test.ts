import { render, screen } from "@testing-library/svelte";
import { thinLabels } from "../../../src/viz/Chart/model.js";
import { user } from "../../utils/user";
import ChartParts from "./ChartParts.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/Chart/line-geometry.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/Chart/line-geometry.js")
    >();
  return {
    ...actual,
    buildLinePath: (...args: Parameters<typeof actual.buildLinePath>) => {
      geometry.calls += 1;
      return actual.buildLinePath(...args);
    },
  };
});

const labels = (id: string) =>
  Array.from(
    screen.getByTestId(id).querySelectorAll(".bx--viz-axis__label"),
  ).map((node) => node.textContent);
const paths = () =>
  Array.from(screen.getByTestId("line").querySelectorAll("path"));
const chart = () => screen.getByRole("application", { name: "Revenue" });

beforeEach(() => {
  geometry.calls = 0;
});

describe("ChartAxis", () => {
  it("labels the y ticks and hides itself from assistive technology", () => {
    render(ChartParts);

    expect(labels("axis-y")).toEqual(["0", "20", "40", "60", "80"]);
    expect(screen.getByTestId("axis-y")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses a custom format and renders a title", () => {
    render(ChartParts, {
      axisFormat: (value: number) => `D${value}`,
      axisTitle: "Day",
    });

    expect(labels("axis-x")[0]).toBe("D0");
    expect(screen.getByTestId("axis-x")).toHaveTextContent("Day");
  });

  it("shows fewer x labels in a narrower chart", async () => {
    const { rerender } = render(ChartParts);
    const wide = labels("axis-x").length;

    await rerender({ width: 200 });
    expect(labels("axis-x").length).toBeLessThan(wide);
  });
});

describe("thinLabels", () => {
  it("keeps every label when they fit", () => {
    expect(thinLabels([0, 100, 200], ["a", "b", "c"])).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("keeps every nth label, starting with the first, when they would collide", () => {
    expect(
      thinLabels(
        [0, 20, 40, 60, 80],
        ["Jan 1", "Jan 2", "Jan 3", "Jan 4", "Jan 5"],
      ),
    ).toEqual([true, false, false, true, false]);
  });

  it("handles zero and one tick", () => {
    expect(thinLabels([], [])).toEqual([]);
    expect(thinLabels([5], ["a"])).toEqual([true]);
  });
});

describe("ChartGrid", () => {
  it("draws one line per y tick, and per x tick on request", async () => {
    const { rerender } = render(ChartParts);
    const count = () => document.querySelectorAll(".bx--viz-grid__line").length;
    expect(count()).toBe(5);

    await rerender({ gridX: true });
    expect(count()).toBeGreaterThan(5);
  });
});

describe("ChartLine", () => {
  it("draws one path per visible series, colored through --bx-viz-color", () => {
    render(ChartParts);

    expect(paths()).toHaveLength(2);
    expect(paths()[0].getAttribute("d")).toMatch(/^M[\d.]+,[\d.]+L/);
    expect(
      (paths()[0] as unknown as HTMLElement).style.getPropertyValue(
        "--bx-viz-color",
      ),
    ).toBe("var(--cds-viz-group-2-1-1)");
  });

  it("removes a hidden series", async () => {
    const { rerender } = render(ChartParts);

    await rerender({ hidden: ["b"] });
    expect(paths()).toHaveLength(1);
  });

  it("breaks the line at a missing value instead of bridging it", () => {
    render(ChartParts, {
      data: [
        { day: 0, region: "a", revenue: 10 },
        { day: 1, region: "a", revenue: 20 },
        { day: 2, region: "a", revenue: null },
        { day: 3, region: "a", revenue: 40 },
        { day: 4, region: "a", revenue: 50 },
      ],
    });

    expect(paths()[0].getAttribute("d")?.match(/M/g)).toHaveLength(2);
  });

  it("draws smooth and stepped curves", async () => {
    const { rerender } = render(ChartParts, { curve: "monotone" });
    expect(paths()[0].getAttribute("d")).toContain("C");

    await rerender({ curve: "step" });
    expect(paths()[0].getAttribute("d")).toMatch(/H[\d.]+V/);
  });

  it("dashes every line, or only the named series", async () => {
    const { rerender } = render(ChartParts, { dashed: ["b"] });
    expect(paths()[0]).not.toHaveClass("bx--viz-line__path--dashed");
    expect(paths()[1]).toHaveClass("bx--viz-line__path--dashed");

    await rerender({ dashed: true });
    expect(paths()[0]).toHaveClass("bx--viz-line__path--dashed");
  });

  it("never rebuilds a path while hovering", async () => {
    render(ChartParts);
    const built = geometry.calls;
    expect(built).toBe(2);

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{Home}{End}");
    expect(
      screen
        .getByTestId("line")
        .querySelectorAll(".bx--viz-line__point--hover"),
    ).toHaveLength(2);
    expect(geometry.calls).toBe(built);
  });

  it("shows hover points only when asked to", async () => {
    render(ChartParts, { points: "none" });

    chart().focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("line").querySelectorAll("circle")).toHaveLength(
      0,
    );
  });

  it("draws every point with points=all", () => {
    render(ChartParts, { points: "all" });

    expect(
      screen.getByTestId("line").querySelectorAll(".bx--viz-line__point"),
    ).toHaveLength(6);
  });

  it("bounds a long series by the plot width, not the data", async () => {
    const long = (n: number) =>
      Array.from({ length: n }, (_, day) => ({
        day,
        region: "a",
        revenue: Math.sin(day / 50) * 100,
      }));
    const { rerender } = render(ChartParts, { data: long(5_000) });
    const small = paths()[0].getAttribute("d")?.length ?? 0;

    await rerender({ data: long(50_000) });
    const large = paths()[0].getAttribute("d")?.length ?? 0;
    expect(large / small).toBeLessThan(1.2);

    await rerender({ data: long(5_000), downsample: false });
    expect(paths()[0].getAttribute("d")?.length ?? 0).toBeGreaterThan(
      small * 2,
    );
  });
});
