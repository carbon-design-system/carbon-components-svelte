import { fireEvent, render, screen } from "@testing-library/svelte";
import ChartForecast from "./ChartForecast.test.svelte";

const geometry = vi.hoisted(() => ({ bands: 0 }));

vi.mock("../../../src/viz/Chart/band-geometry.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/Chart/band-geometry.js")
    >();
  return {
    ...actual,
    buildBands: (...args: Parameters<typeof actual.buildBands>) => {
      geometry.bands += 1;
      return actual.buildBands(...args);
    },
  };
});

const paths = (id: string) =>
  Array.from(screen.getByTestId(id).querySelectorAll("path"));
const labels = () =>
  Array.from(
    screen.getByTestId("axis-y").querySelectorAll(".bx--viz-axis__label"),
  ).map((node) => node.textContent);

beforeEach(() => {
  geometry.bands = 0;
});

describe("ChartLine forecastFrom", () => {
  it("draws one solid path per series without a cut", () => {
    render(ChartForecast);
    const all = paths("line");
    expect(all).toHaveLength(1);
    expect(all[0]).not.toHaveClass("bx--viz-line__path--dashed");
  });

  it("dashes the line from the cut and keeps the halves joined", () => {
    render(ChartForecast, { forecastFrom: 2 });
    const [solid, dashed] = paths("line");
    expect(solid).not.toHaveClass("bx--viz-line__path--dashed");
    expect(dashed).toHaveClass("bx--viz-line__path--dashed");
    // The solid path ends where the dashed one starts.
    const end = solid.getAttribute("d")?.split("L").pop();
    const start = dashed.getAttribute("d")?.slice(1).split("L")[0];
    expect(end).toBe(start);
  });
});

describe("ChartBand", () => {
  it("fills between the bounds and keeps them inside the y domain", () => {
    render(ChartForecast, { band: true });
    expect(paths("band")).toHaveLength(1);
    expect(paths("band")[0].getAttribute("d")).toMatch(/^M.*Z$/);
    // The data tops out at 50; the band reaches 90.
    expect(labels()).toContain("100");
    expect(screen.getByTestId("band")).toHaveAttribute("aria-hidden", "true");
  });

  it("is built once per data change, not on hover", async () => {
    render(ChartForecast, { band: true });
    const built = geometry.bands;
    expect(built).toBeGreaterThan(0);
    const chart = screen.getByRole("application", { name: "Demand" });
    chart.focus();
    await fireEvent.keyDown(chart, { key: "ArrowRight" });
    await fireEvent.keyDown(chart, { key: "ArrowRight" });
    expect(geometry.bands).toBe(built);
  });
});

describe("ChartAnomalies", () => {
  it("marks each flagged datum with a named diamond", () => {
    render(ChartForecast, { anomalies: true });
    const markers = paths("anomalies");
    expect(markers).toHaveLength(1);
    expect(markers[0].getAttribute("d")).toMatch(/^M.*Z$/);
    expect(
      screen.getByRole("img", { name: "Anomaly: 2, 30" }),
    ).toContainElement(markers[0]);
  });

  it("draws nothing for a hidden series", () => {
    render(ChartForecast, { anomalies: true, hidden: ["s"] });
    expect(paths("anomalies")).toHaveLength(0);
  });
});
