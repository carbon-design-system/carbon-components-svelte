import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import SlopeChart from "./SlopeChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/SlopeChart/slope-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/SlopeChart/slope-geometry.js")
      >();
    return {
      ...actual,
      buildSlope: (...args: Parameters<typeof actual.buildSlope>) => {
        geometry.calls += 1;
        return actual.buildSlope(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Score change" });
const lines = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-slope__series"));
const cells = () =>
  Array.from(screen.getByTestId("slope").querySelectorAll("tbody tr")).map(
    (row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) =>
        cell.textContent?.trim(),
      ),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("SlopeChart", () => {
  it("draws a line per series between two period columns, labeled at both ends, and a table with the change", () => {
    render(SlopeChart);

    expect(
      Array.from(document.querySelectorAll(".bx--viz-slope__period")).map((n) =>
        n.textContent?.trim(),
      ),
    ).toEqual(["2024", "2025"]);
    expect(lines()).toHaveLength(3);
    const labels = Array.from(
      lines()[0].querySelectorAll(".bx--viz-slope__label"),
    ).map((n) => n.textContent?.replace(/\s+/g, " ").trim());
    expect(labels).toEqual(["Web 62", "71 Web"]);
    expect(cells()).toEqual([
      ["Web", "62", "71", "+9"],
      ["Data", "58", "39", "-19"],
      ["Mobile", "41", "41", "0"],
    ]);
    expect(
      screen
        .getByRole("table", { hidden: true })
        .querySelectorAll("th[scope=col]")[3],
    ).toHaveTextContent("Change");
  });

  it("colors by direction with the good way configurable, by series, or not at all", async () => {
    const { rerender } = render(SlopeChart);
    expect(lines()[0]).toHaveClass("bx--viz-slope__series--good");
    expect(lines()[1]).toHaveClass("bx--viz-slope__series--bad");
    expect(lines()[2]).toHaveClass("bx--viz-slope__series--flat");
    expect(lines()[0].style.getPropertyValue("--bx-viz-color")).toBe("");

    await rerender({ positive: "down" });
    expect(lines()[0]).toHaveClass("bx--viz-slope__series--bad");
    expect(lines()[1]).toHaveClass("bx--viz-slope__series--good");

    await rerender({ colorBy: "series" });
    expect(lines()[0]).toHaveClass("bx--viz-slope__series--series");
    expect(lines()[0].style.getPropertyValue("--bx-viz-color")).toMatch(
      /^var\(--cds-viz-/,
    );
    expect(lines()[0].style.getPropertyValue("--bx-viz-color")).not.toBe(
      lines()[1].style.getPropertyValue("--bx-viz-color"),
    );

    await rerender({ colorBy: "none" });
    expect(lines()[0]).toHaveClass("bx--viz-slope__series--none");
  });

  it("walks the lines top to bottom with the keyboard, announcing each, without laying out again", async () => {
    const onhover = vi.fn();
    render(SlopeChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}");
    // Web has the highest 2024 value, so it is first.
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ series: "Web", change: 9, direction: "up" }),
    );
    expect(lines()[0]).toHaveClass("bx--viz-slope__series--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Web: 62 2024, 71 2025, +9",
    );
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ series: "Mobile" }),
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("selects on click and Enter", async () => {
    const onselect = vi.fn();
    render(SlopeChart, { onselect });

    await fireEvent.click(lines()[1]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        series: "Data",
        from: 58,
        to: 39,
        fromDatum: expect.objectContaining({ year: 2024 }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("Data");
    expect(lines()[1]).toHaveClass("bx--viz-slope__series--selected");

    chart().focus();
    await user.keyboard("{Home}{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("Web");
  });
});
