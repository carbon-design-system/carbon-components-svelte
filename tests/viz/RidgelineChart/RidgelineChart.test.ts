import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import RidgelineChart from "./RidgelineChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/RidgelineChart/ridgeline-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/RidgelineChart/ridgeline-geometry.js")
      >();
    return {
      ...actual,
      buildRidgeline: (...args: Parameters<typeof actual.buildRidgeline>) => {
        geometry.calls += 1;
        return actual.buildRidgeline(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Temperature by month" });
const rows = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-ridgeline__row"));
const labels = () =>
  rows().map((row) =>
    row.querySelector(".bx--viz-ridgeline__label")?.textContent?.trim(),
  );
const cells = () =>
  Array.from(screen.getByTestId("ridge").querySelectorAll("tbody tr")).map(
    (row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) =>
        cell.textContent?.trim(),
      ),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("RidgelineChart", () => {
  it("draws a ridge per series on one shared axis and lists the summary in a table", () => {
    render(RidgelineChart);

    expect(labels()).toEqual(["Jan", "Jul", "Apr"]);
    expect(
      rows()[0].querySelector(".bx--viz-ridgeline__area")?.getAttribute("d"),
    ).toMatch(/Z$/);
    expect(
      document.querySelectorAll(".bx--viz-ridgeline__axis-label").length,
    ).toBeGreaterThan(2);
    expect(cells()[2].slice(0, 3)).toEqual(["Apr", "5", "12"]);
    expect(rows()[0].style.getPropertyValue("--bx-viz-color")).toBe("");
    // Each baseline sits a row below the last.
    const y = (i: number) =>
      Number(
        rows()
          [i].querySelector(".bx--viz-ridgeline__baseline")
          ?.getAttribute("y1"),
      );
    expect(y(1) - y(0)).toBe(36);
  });

  it("walks the rows with the keyboard, announcing the summary, without laying out again", async () => {
    const onhover = vi.fn();
    render(RidgelineChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ series: "Jul", count: 6, median: 20.5 }),
    );
    expect(rows()[1]).toHaveClass("bx--viz-ridgeline__row--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      /Jul: Median 20.5, Peak [\d.]+, Count 6/,
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("selects on click and Enter, orders by median, and colors by series", async () => {
    const onselect = vi.fn();
    const { rerender } = render(RidgelineChart, { onselect });

    await fireEvent.click(rows()[2]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ series: "Apr", count: 5 }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("Apr");
    expect(rows()[2]).toHaveClass("bx--viz-ridgeline__row--selected");

    await rerender({ onselect, order: "median", colorBy: "series" });
    expect(labels()).toEqual(["Jan", "Apr", "Jul"]);
    expect(rows()[0].style.getPropertyValue("--bx-viz-color")).toMatch(
      /^var\(--cds-viz-/,
    );
    expect(rows()[0].style.getPropertyValue("--bx-viz-color")).not.toBe(
      rows()[1].style.getPropertyValue("--bx-viz-color"),
    );
  });
});
