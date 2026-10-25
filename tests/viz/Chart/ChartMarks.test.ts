import { render } from "@testing-library/svelte";
import ChartMarks from "./ChartMarks.test.svelte";

const texts = (selector: string) =>
  Array.from(document.querySelectorAll(selector)).map((el) =>
    el.textContent?.trim(),
  );

describe("data labels, error bars, and annotations", () => {
  it("labels bars outside, totals a stack, and keeps labels that fit when auto", async () => {
    const { rerender } = render(ChartMarks, {
      mark: "bars",
      labels: "outside",
    });
    expect(texts(".bx--viz-labels__label")).toEqual(["10", "15", "20", "5"]);
    expect(document.querySelectorAll(".bx--viz-errors__bar")).toHaveLength(4);

    await rerender({ mark: "bars", mode: "stacked", labels: "outside" });
    expect(texts(".bx--viz-labels__label").sort()).toEqual(["25", "25"]);

    // Narrow bars cannot carry a label; auto drops them rather than overlap.
    await rerender({
      mark: "bars",
      mode: "grouped",
      labels: "auto",
      width: 120,
    });
    expect(
      document.querySelectorAll(".bx--viz-labels__label").length,
    ).toBeLessThan(4);
  });

  it("names a line at its end and labels points by a row field", async () => {
    const { rerender } = render(ChartMarks, { mark: "line", labels: "end" });
    expect(texts(".bx--viz-labels__label").sort()).toEqual(["a", "b"]);

    await rerender({ mark: "points", labels: "all" });
    expect(texts(".bx--viz-labels__label")).toContain("Monday");
  });

  it("draws a moment across the plot and a point marker, each with its label", () => {
    render(ChartMarks, { mark: "line" });
    expect(
      document.querySelectorAll(".bx--viz-annotations__line"),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll(".bx--viz-annotations__marker"),
    ).toHaveLength(1);
    expect(texts(".bx--viz-annotations__label").sort()).toEqual([
      "Launch",
      "Peak",
    ]);
    expect(
      document.querySelector(".bx--viz-annotations__item--warning"),
    ).not.toBeNull();
  });
});
