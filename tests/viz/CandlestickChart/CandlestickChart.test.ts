import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import CandlestickChart from "./CandlestickChart.test.svelte";

const chart = () =>
  screen.getByRole("application", { name: "ACME, this week" });
const candles = () =>
  Array.from(
    document.querySelectorAll<SVGGElement>(".bx--viz-candles__candle"),
  );
const number = (node: Element | null, name: string) =>
  Number(node?.getAttribute(name));

describe("CandlestickChart", () => {
  it("draws a candle per period with direction classes, hollow when rising, and skips a period missing a price", () => {
    render(CandlestickChart);

    expect(candles()).toHaveLength(4);
    expect(candles()[0]).toHaveClass("bx--viz-candles__candle--up");
    expect(candles()[0]).toHaveClass("bx--viz-candles__candle--hollow");
    expect(candles()[1]).toHaveClass("bx--viz-candles__candle--down");
    expect(candles()[1]).not.toHaveClass("bx--viz-candles__candle--hollow");
    expect(candles()[2]).not.toHaveClass("bx--viz-candles__candle--up");
    expect(candles()[2]).not.toHaveClass("bx--viz-candles__candle--down");
    expect(
      number(candles()[2].querySelector(".bx--viz-candles__body"), "height"),
    ).toBe(1);
    expect(document.querySelector(".bx--viz-legend")).toBeNull();
  });

  it("keeps the wicks inside the plot by growing the y domain past the open and close", () => {
    render(CandlestickChart);

    const wick = candles()[3].querySelector(".bx--viz-candles__wick");
    expect(number(wick, "y1")).toBeGreaterThanOrEqual(0);
    const labels = Array.from(
      document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
    ).map((n) => Number(n.textContent));
    expect(Math.max(...labels)).toBeGreaterThanOrEqual(112);
    expect(Math.min(...labels)).toBeLessThanOrEqual(95);
    // The axis is not forced to zero.
    expect(Math.min(...labels)).toBeGreaterThan(0);
  });

  it("reads out the four prices and the change for the focused period, dimming the rest", async () => {
    render(CandlestickChart);

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("Tue");
    for (const text of [
      /Open\s*106/,
      /High\s*110/,
      /Low\s*99/,
      /Close\s*101/,
      /Change\s*-5/,
    ]) {
      expect(tooltip).toHaveTextContent(text);
    }
    expect(
      document.querySelectorAll(".bx--viz-candles__candle--dimmed"),
    ).toHaveLength(3);
  });

  it("fills rising candles when not hollow and lists the prices in the table view", async () => {
    const { rerender } = render(CandlestickChart, { hollow: false });
    expect(candles()[0]).not.toHaveClass("bx--viz-candles__candle--hollow");

    await rerender({ hollow: false, view: "table" });
    const table = screen.getByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(["Period", "Open", "High", "Low", "Close"]);
    expect(within(table).getAllByRole("row")).toHaveLength(5);
  });
});
