import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChoroplethChart from "./ChoroplethChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/utils/geo-path.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/viz/utils/geo-path.js")>();
  return {
    ...actual,
    geoPaths: (...args: Parameters<typeof actual.geoPaths>) => {
      geometry.calls += 1;
      return actual.geoPaths(...args);
    },
  };
});

const chart = () =>
  screen.getByRole("application", { name: "Sales by region" });
const regions = () =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".bx--viz-choropleth__region"),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("ChoroplethChart", () => {
  it("colors each region by its total, and leaves one with no data neutral", () => {
    render(ChoroplethChart);

    const [west, central, east] = regions();
    expect(west.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-02)",
    );
    expect(east.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-11)",
    );
    // A null value is no data, not a zero.
    expect(central).toHaveClass("bx--viz-choropleth__region--empty");
    expect(central.style.getPropertyValue("--bx-viz-color")).toBe("");
  });

  it("gives assistive technology every region as a table, by name", () => {
    render(ChoroplethChart);

    const table = screen.getByRole("table", { name: "Sales by region" });
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) =>
          Array.from(row.children).map((cell) => cell.textContent?.trim()),
        ),
    ).toEqual([
      ["Region", "Value"],
      ["Central", "No data"],
      ["East", "100"],
      ["West", "40"],
    ]);
  });

  it("moves region to region by name, without projecting the map again", async () => {
    const onhover = vi.fn();
    render(ChoroplethChart, { onhover });
    const projected = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "east", label: "East", value: 100 }),
    );
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /East\s*100/,
    );
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "East: 100",
    );
    expect(
      document.querySelectorAll(".bx--viz-choropleth__outline"),
    ).toHaveLength(1);
    expect(geometry.calls).toBe(projected);
  });

  it("selects the focused region with the rows summed into it", async () => {
    const onselect = vi.fn();
    render(ChoroplethChart, { onselect });

    chart().focus();
    await user.keyboard("{End}{Enter}");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      region: {
        id: "west",
        value: 40,
        rows: [
          { area: "west", sales: 10 },
          { area: "west", sales: 30 },
        ],
      },
    });
  });

  it("shows the ends of the ramp in a legend", () => {
    render(ChoroplethChart);

    expect(
      document.querySelector(".bx--viz-heatmap__legend"),
    ).toHaveTextContent(/^40\s*100$/);
  });
});
