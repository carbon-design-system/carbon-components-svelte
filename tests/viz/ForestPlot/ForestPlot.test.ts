import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ForestPlot from "./ForestPlot.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/ForestPlot/forest-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/ForestPlot/forest-geometry.js")
      >();
    return {
      ...actual,
      buildForest: (...args: Parameters<typeof actual.buildForest>) => {
        geometry.calls += 1;
        return actual.buildForest(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Odds ratio by region" });
const rows = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-forest__row"));
const cells = () =>
  Array.from(screen.getByTestId("forest").querySelectorAll("tbody tr")).map(
    (row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) =>
        cell.textContent?.replace(/\s+/g, " ").trim(),
      ),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("ForestPlot", () => {
  it("draws a row per study with a whisker, a marker hollow when it crosses the null, the values, and a null line", () => {
    render(ForestPlot);

    expect(rows()).toHaveLength(3);
    expect(rows()[0].querySelector(".bx--viz-forest__whisker")).not.toBeNull();
    expect(rows()[0]).not.toHaveClass("bx--viz-forest__row--clear");
    expect(rows()[2]).toHaveClass("bx--viz-forest__row--clear");
    expect(rows()[0].querySelector(".bx--viz-forest__value")).toHaveTextContent(
      "1.12 (0.91, 1.38)",
    );
    expect(document.querySelector(".bx--viz-forest__null")).not.toBeNull();
    expect(document.querySelector(".bx--viz-forest__overall")).toBeNull();
    expect(cells()).toEqual([
      ["North", "1.12", "0.91 to 1.38"],
      ["South", "0.94", "0.8 to 1.1"],
      ["EU", "1.21", "1.02 to 1.48"],
    ]);
    // Same marker size without weights.
    const size = (i: number) =>
      rows()[i].querySelector(".bx--viz-forest__marker")?.getAttribute("width");
    expect(size(0)).toBe(size(1));
  });

  it("adds the pooled diamond, sizes markers by weight, and lists the weight", () => {
    render(ForestPlot, {
      withWeight: true,
      overall: { estimate: 1.06, lo: 1.01, hi: 1.16, label: "Pooled" },
    });

    const diamond = document.querySelector(".bx--viz-forest__diamond");
    expect(diamond).toHaveClass("bx--viz-forest__diamond--clear");
    expect(
      document.querySelector(".bx--viz-forest__label--overall"),
    ).toHaveTextContent("Pooled");
    const size = (i: number) =>
      Number(
        rows()
          [i].querySelector(".bx--viz-forest__marker")
          ?.getAttribute("width"),
      );
    expect(size(1)).toBeGreaterThan(size(0));
    expect(size(0)).toBeGreaterThan(size(2));
    expect(cells()[1]).toEqual(["South", "0.94", "0.8 to 1.1", "900"]);
    expect(cells()[3]).toEqual(["Pooled", "1.06", "1.01 to 1.16", ""]);
  });

  it("walks the rows with the keyboard, announcing the finding, without laying out again", async () => {
    const onhover = vi.fn();
    render(ForestPlot, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ label: "EU", clear: true, index: 2 }),
    );
    expect(rows()[2]).toHaveClass("bx--viz-forest__row--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "EU: 1.21 (1.02, 1.48), clear of the null",
    );
    await user.keyboard("{Home}");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "North: 1.12 (0.91, 1.38), crosses the null",
    );
    expect(geometry.calls).toBe(built);
  });

  it("selects on click and Enter, and lays out on a log scale when asked", async () => {
    const onselect = vi.fn();
    const { rerender } = render(ForestPlot, { onselect });

    await fireEvent.click(rows()[1]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ label: "South", estimate: 0.94 }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("South");
    expect(rows()[1]).toHaveClass("bx--viz-forest__row--selected");

    const before = document
      .querySelector(".bx--viz-forest__null")
      ?.getAttribute("x1");
    await rerender({ onselect, scale: "log" });
    expect(
      document.querySelector(".bx--viz-forest__null")?.getAttribute("x1"),
    ).not.toBe(before);
    expect(
      Array.from(document.querySelectorAll(".bx--viz-forest__axis-label")).map(
        (n) => n.textContent?.trim(),
      ),
    ).toContain("1");
  });
});
