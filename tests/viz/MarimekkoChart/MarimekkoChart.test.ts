import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import MarimekkoChart from "./MarimekkoChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/MarimekkoChart/marimekko-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/MarimekkoChart/marimekko-geometry.js")
      >();
    return {
      ...actual,
      buildMarimekko: (...args: Parameters<typeof actual.buildMarimekko>) => {
        geometry.calls += 1;
        return actual.buildMarimekko(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Market map" });
const cells = () =>
  Array.from(
    document.querySelectorAll<SVGGElement>(".bx--viz-marimekko__cell"),
  );
const boxWidth = (i: number) =>
  Number(cells()[i].querySelector("rect")?.getAttribute("width"));
const table = () =>
  Array.from(screen.getByTestId("marimekko").querySelectorAll("tr")).map(
    (row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) =>
        cell.textContent?.replace(/\s+/g, " ").trim(),
      ),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("MarimekkoChart", () => {
  it("draws a cell per row in columns as wide as their total, labels the ones with room, and lists shares in a table", () => {
    render(MarimekkoChart);

    expect(cells()).toHaveLength(5);
    // Equal totals: equal widths.
    expect(boxWidth(0)).toBe(boxWidth(2));
    expect(
      Array.from(
        document.querySelectorAll(".bx--viz-marimekko__column-label"),
      ).map((n) => n.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["Enterprise 50%", "Mid-market 50%"]);
    expect(
      Array.from(cells()[0].querySelectorAll(".bx--viz-marimekko__label")).map(
        (n) => n.textContent?.trim(),
      ),
    ).toEqual(["Acme", "60%"]);
    expect(table()).toEqual([
      ["Series", "Enterprise (50%)", "Mid-market (50%)"],
      ["Acme", "60%", "25%"],
      ["Beta", "40%", "50%"],
      ["Ce", "", "25%"],
    ]);
    expect(
      Array.from(
        screen
          .getByTestId("marimekko")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["Acme", "Beta", "Ce"]);
  });

  it("sizes columns by a given field and can drop the labels", () => {
    render(MarimekkoChart, { bySize: true, labels: "none" });

    expect(boxWidth(0)).toBeCloseTo(boxWidth(2) * 3);
    expect(document.querySelectorAll(".bx--viz-marimekko__label")).toHaveLength(
      0,
    );
  });

  it("moves between cells with the keyboard, keeping the series across columns, with a tooltip and no relayout", async () => {
    const onhover = vi.fn();
    render(MarimekkoChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: "Enterprise", series: "Beta", share: 0.4 }),
    );
    expect(cells()[1]).toHaveClass("bx--viz-marimekko__cell--active");
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      "Beta, Enterprise",
    );
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Beta, Enterprise: 40% of Enterprise, Enterprise 50% of all",
    );

    await user.keyboard("{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: "Mid-market", series: "Beta", share: 0.5 }),
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(document.querySelector(".bx--viz-chart-tooltip")).toBeNull();
    expect(geometry.calls).toBe(built);
  });

  it("selects on click and Enter", async () => {
    const onselect = vi.fn();
    render(MarimekkoChart, { onselect });

    await fireEvent.click(cells()[4]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        x: "Mid-market",
        series: "Ce",
        value: 25,
        columnShare: 0.5,
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("Mid-market/Ce");
    expect(cells()[4]).toHaveClass("bx--viz-marimekko__cell--selected");

    chart().focus();
    await user.keyboard("{Home}{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("Enterprise/Acme");
  });
});
