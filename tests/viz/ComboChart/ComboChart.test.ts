import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ComboChart from "./ComboChart.test.svelte";

const chart = () =>
  screen.getByRole("application", { name: "Revenue, cost, and margin" });
const labels = (side: string) =>
  Array.from(
    document.querySelectorAll(`.bx--viz-axis--${side} .bx--viz-axis__label`),
  ).map((node) => node.textContent?.trim());

describe("ComboChart", () => {
  it("draws the named series as bars and the rest as a line", () => {
    render(ComboChart);

    // Two bar series over two quarters, and one line.
    expect(document.querySelectorAll(".bx--viz-bars__bar")).toHaveLength(4);
    expect(document.querySelectorAll(".bx--viz-line__path")).toHaveLength(1);
  });

  it("plots the secondary series on its own axis, on the right", () => {
    render(ComboChart);

    expect(labels("left").at(-1)).toBe("2K");
    expect(labels("right")[0]).toBe("0%");
    expect(labels("right").at(-1)).toBe("40%");
    expect(
      document.querySelector(".bx--viz-axis--right .bx--viz-axis__title"),
    ).toHaveTextContent("Margin");

    // 0.4 reaches the top of the secondary axis, not the floor of the first.
    const dots = Array.from(
      document.querySelectorAll<SVGCircleElement>(".bx--viz-line__point"),
    ).map((dot) => Number(dot.getAttribute("cy")));
    const bars = Array.from(
      document.querySelectorAll<SVGRectElement>(".bx--viz-bars__bar"),
    ).map((bar) => Number(bar.getAttribute("y")));
    expect(Math.min(...dots)).toBeLessThan(Math.min(...bars));
  });

  it("has no right axis, and flattens the line, without a secondary series", () => {
    render(ComboChart, { secondary: [] });

    expect(document.querySelector(".bx--viz-axis--right")).toBeNull();
    const dots = Array.from(
      document.querySelectorAll<SVGCircleElement>(".bx--viz-line__point"),
    ).map((dot) => Number(dot.getAttribute("cy")));
    const zero = Number(
      document.querySelector(".bx--viz-axis--bottom line")?.getAttribute("y1"),
    );
    expect(zero - Math.min(...dots)).toBeLessThan(1);
  });

  it("writes each series in its own axis's format, in the tooltip and the table", async () => {
    const { unmount } = render(ComboChart);

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent(/Revenue\s*1.8K/);
    expect(tooltip).toHaveTextContent(/Margin\s*40%/);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Q2: Revenue 1.8K, Cost 1.1K, Margin 40%",
    );
    unmount();

    render(ComboChart, { view: "table" });
    const table = within(
      screen.getByRole("region", {
        name: "Revenue, cost, and margin, data table",
      }),
    ).getByRole("table");
    expect(
      Array.from(within(table).getAllByRole("row")[2].children).map((cell) =>
        cell.textContent?.trim(),
      ),
    ).toEqual(["Q2", "1.8K", "1.1K", "40%"]);
  });
});
