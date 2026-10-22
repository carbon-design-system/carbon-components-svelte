import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import BumpChart from "./BumpChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/BumpChart/bump-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/BumpChart/bump-geometry.js")
      >();
    return {
      ...actual,
      buildBump: (...args: Parameters<typeof actual.buildBump>) => {
        geometry.calls += 1;
        return actual.buildBump(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Leaderboard" });
const lines = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-bump__series"));
const ranksOf = (line: SVGGElement) =>
  Array.from(line.querySelectorAll(".bx--viz-bump__rank")).map((n) =>
    n.textContent?.trim(),
  );
const cells = () =>
  Array.from(screen.getByTestId("bump").querySelectorAll("tbody tr")).map(
    (row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) =>
        cell.textContent?.trim(),
      ),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("BumpChart", () => {
  it("draws a line per series with the rank in each dot, labels at both ends, and a table of ranks", () => {
    render(BumpChart);

    expect(
      Array.from(document.querySelectorAll(".bx--viz-bump__period")).map((n) =>
        n.textContent?.trim(),
      ),
    ).toEqual(["W1", "W2", "W3"]);
    expect(document.querySelectorAll(".bx--viz-bump__row")).toHaveLength(3);
    expect(lines()).toHaveLength(3);
    expect(ranksOf(lines()[0])).toEqual(["1", "2", "3"]);
    expect(
      Array.from(lines()[0].querySelectorAll(".bx--viz-bump__label")).map((n) =>
        n.textContent?.trim(),
      ),
    ).toEqual(["Ada", "Ada"]);
    expect(lines()[0].style.getPropertyValue("--bx-viz-color")).not.toBe(
      lines()[1].style.getPropertyValue("--bx-viz-color"),
    );
    expect(cells()).toEqual([
      ["Ada", "1", "2", "3"],
      ["Bell", "2", "1", "1"],
      ["Cray", "3", "3", "2"],
    ]);
    // Three rank rows at 32px each, under a 24px header and padding.
    expect(chart().getAttribute("viewBox")).toBe("0 0 560 132");
  });

  it("ranks by value when given values instead of ranks, and writes the value in the table", () => {
    render(BumpChart, {
      byValue: true,
      data: [
        { week: "W1", team: "Ada", points: 10 },
        { week: "W1", team: "Bell", points: 30 },
        { week: "W2", team: "Ada", points: 40 },
        { week: "W2", team: "Bell", points: 20 },
      ],
    });

    expect(ranksOf(lines()[0])).toEqual(["2", "1"]);
    expect(cells()[0]).toEqual(["Ada", "2 (10)", "1 (40)"]);
    expect(document.querySelectorAll(".bx--viz-bump__row")).toHaveLength(2);
  });

  it("walks the lines by final rank with the keyboard, announcing the move, without laying out again", async () => {
    const onhover = vi.fn();
    render(BumpChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ series: "Bell", start: 2, end: 1, change: 1 }),
    );
    expect(lines()[1]).toHaveClass("bx--viz-bump__series--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Bell: rank 2 W1, rank 1 W3, up 1",
    );
    await user.keyboard("{End}");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Ada: rank 1 W1, rank 3 W3, down 2",
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("selects on click and Enter, with every point in the detail", async () => {
    const onselect = vi.fn();
    render(BumpChart, { onselect });

    await fireEvent.click(lines()[2]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        series: "Cray",
        points: [
          expect.objectContaining({ period: "W1", rank: 3 }),
          expect.objectContaining({ period: "W2", rank: 3 }),
          expect.objectContaining({ period: "W3", rank: 2 }),
        ],
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("Cray");
    expect(lines()[2]).toHaveClass("bx--viz-bump__series--selected");

    chart().focus();
    await user.keyboard("{Home}{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("Bell");
  });
});
