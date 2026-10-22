import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import SunburstChart from "./SunburstChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/SunburstChart/sunburst-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/SunburstChart/sunburst-geometry.js")
      >();
    return {
      ...actual,
      buildSunburst: (...args: Parameters<typeof actual.buildSunburst>) => {
        geometry.calls += 1;
        return actual.buildSunburst(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Bundle composition" });
const arcs = () =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".bx--viz-sunburst__arc"),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("SunburstChart", () => {
  it("draws an arc per descendant of the center, colored by branch, with the total in the middle", () => {
    render(SunburstChart);

    expect(arcs()).toHaveLength(4);
    expect(arcs()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      arcs()[1].style.getPropertyValue("--bx-viz-color"),
    );
    expect(
      document.querySelector(".bx--viz-sunburst__center-value"),
    ).toHaveTextContent("1K");
    expect(document.querySelector(".bx--viz-sunburst__up")).toBeNull();
    expect(
      Array.from(
        screen
          .getByTestId("sunburst")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["src", "vendor"]);
  });

  it("gives assistive technology every arc as a table", () => {
    render(SunburstChart);

    const table = screen.getByRole("table", { name: "Bundle composition" });
    const rows = within(table)
      .getAllByRole("row")
      .map((row) =>
        Array.from(row.children).map((cell) => cell.textContent?.trim()),
      );
    expect(rows[0]).toEqual(["Node", "Level", "Value", "Share"]);
    expect(rows[1]).toEqual(["src", "1", "600", "60%"]);
    expect(rows[2]).toEqual(["viz", "2", "400", "40%"]);
  });

  it("moves arc to arc with the keyboard, and drills on Enter, without laying out until it drills", async () => {
    const onhover = vi.fn();
    render(SunburstChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "viz", value: 400 }),
    );
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "viz: 400, 40%",
    );
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /viz/,
    );
    expect(geometry.calls).toBe(built);

    await user.keyboard("{ArrowLeft}{Enter}");
    expect(screen.getByTestId("root")).toHaveTextContent("src");
    expect(arcs()).toHaveLength(2);
    expect(
      document.querySelector(".bx--viz-sunburst__center-label"),
    ).toHaveTextContent("src");
  });

  it("steps back up from the center button and with Backspace", async () => {
    render(SunburstChart, { root: "viz" });
    expect(arcs()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Up: viz" }));
    expect(screen.getByTestId("root")).toHaveTextContent("src");
    expect(arcs()).toHaveLength(2);

    chart().focus();
    await user.keyboard("{Backspace}");
    expect(screen.getByTestId("root")).toHaveTextContent("bundle");
    expect(arcs()).toHaveLength(4);
    expect(document.querySelector(".bx--viz-sunburst__up")).toBeNull();
  });
});
