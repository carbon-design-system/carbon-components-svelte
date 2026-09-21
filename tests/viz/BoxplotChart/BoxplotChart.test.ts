import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import BoxplotChart from "./BoxplotChart.test.svelte";

const chart = () =>
  screen.getByRole("application", { name: "Latency by service" });
const number = (node: Element | null, name: string) =>
  Number(node?.getAttribute(name));

describe("BoxplotChart", () => {
  it("draws a box, a median, whiskers, and outliers for each group", () => {
    render(BoxplotChart);

    const boxes = document.querySelectorAll(".bx--viz-boxes__box");
    expect(boxes).toHaveLength(2);
    expect(boxes[0].querySelectorAll(".bx--viz-boxes__whisker")).toHaveLength(
      4,
    );
    expect(boxes[0].querySelectorAll(".bx--viz-boxes__median")).toHaveLength(1);
    // 300 is beyond 1.5 × IQR of the api values.
    expect(boxes[0].querySelectorAll(".bx--viz-boxes__outlier")).toHaveLength(
      1,
    );
    expect(boxes[1].querySelectorAll(".bx--viz-boxes__outlier")).toHaveLength(
      0,
    );
  });

  it("keeps the outlier inside the plot by growing the y domain", () => {
    render(BoxplotChart);

    const outlier = document.querySelector(".bx--viz-boxes__outlier");
    const median = document.querySelector(".bx--viz-boxes__median");
    expect(number(outlier, "cy")).toBeGreaterThanOrEqual(0);
    expect(number(outlier, "cy")).toBeLessThan(number(median, "y1"));
    const top = Array.from(
      document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
    ).at(-1);
    expect(Number(top?.textContent)).toBeGreaterThanOrEqual(300);
  });

  it("reads out all five statistics and the count for the focused group", async () => {
    render(BoxplotChart);

    chart().focus();
    await user.keyboard("{ArrowRight}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("api");
    for (const text of [
      /Maximum\s*90/,
      /Upper quartile\s*77.5/,
      /Median\s*55/,
      /Lower quartile\s*32.5/,
      /Minimum\s*10/,
      /Count\s*10/,
    ]) {
      expect(tooltip).toHaveTextContent(text);
    }
    expect(
      document.querySelectorAll(".bx--viz-boxes__box--dimmed"),
    ).toHaveLength(1);
  });

  it("lists every statistic in the table view", () => {
    render(BoxplotChart, { view: "table" });

    const table = within(
      screen.getByRole("region", { name: "Latency by service, data table" }),
    ).getByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((th) => th.textContent?.trim())
        .slice(1),
    ).toEqual([
      "Maximum",
      "Upper quartile",
      "Median",
      "Lower quartile",
      "Minimum",
    ]);
  });

  it("lies on its side when horizontal", () => {
    render(BoxplotChart, { orientation: "horizontal" });

    const median = document.querySelector(".bx--viz-boxes__median");
    expect(number(median, "x1")).toBe(number(median, "x2"));
    expect(number(median, "y1")).not.toBe(number(median, "y2"));
  });
});
