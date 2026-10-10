import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import RadarChart from "./RadarChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/RadarChart/radar-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/RadarChart/radar-geometry.js")
      >();
    return {
      ...actual,
      buildRadar: (...args: Parameters<typeof actual.buildRadar>) => {
        geometry.calls += 1;
        return actual.buildRadar(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Skills" });

beforeEach(() => {
  geometry.calls = 0;
});

describe("RadarChart", () => {
  it("draws a polygon per series over a spoke per axis value", () => {
    render(RadarChart);

    expect(document.querySelectorAll(".bx--viz-radar__area")).toHaveLength(2);
    expect(
      Array.from(document.querySelectorAll(".bx--viz-radar__label")).map(
        (node) => node.textContent?.trim(),
      ),
    ).toEqual(["Speed", "Power", "Range"]);
  });

  it("gives assistive technology every value as a table", () => {
    render(RadarChart);

    const table = screen.getByRole("table", { name: "Skills" });
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) =>
          Array.from(row.children).map((cell) => cell.textContent?.trim()),
        ),
    ).toEqual([
      ["Axis", "Ada", "Bo"],
      ["Speed", "80", "30"],
      ["Power", "40", "90"],
      ["Range", "60", "10"],
    ]);
  });

  it("moves spoke to spoke with the keyboard, without rebuilding the geometry", async () => {
    const onhover = vi.fn();
    render(RadarChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith({
      axis: "Power",
      points: [
        { series: "Ada", value: 40 },
        { series: "Bo", value: 90 },
      ],
    });
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("Power");
    expect(tooltip).toHaveTextContent(/Bo\s*90/);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Power: Ada 40, Bo 90",
    );
    expect(document.querySelectorAll(".bx--viz-radar__point")).toHaveLength(2);
    expect(geometry.calls).toBe(built);

    // The arrow keys wrap around the circle.
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ axis: "Speed" }),
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("hides a series from the legend, but never the last one", async () => {
    const ontoggle = vi.fn();
    render(RadarChart, { ontoggle });

    const legend = screen.getByRole("group", { name: "Series" });
    const [ada, bo] = within(legend).getAllByRole("button");
    await user.click(bo);
    expect(bo).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("hidden")).toHaveTextContent("Bo");
    expect(ontoggle).toHaveBeenCalledWith({ series: "Bo", hidden: true });
    expect(document.querySelectorAll(".bx--viz-radar__area")).toHaveLength(1);

    await user.click(ada);
    expect(ada).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("hidden")).toHaveTextContent("Bo");
  });
});
