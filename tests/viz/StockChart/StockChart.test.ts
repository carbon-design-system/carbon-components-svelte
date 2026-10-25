import { render, screen } from "@testing-library/svelte";
import type { ComponentType, SvelteComponent } from "svelte";
import StockChart from "../../../src/viz/StockChart/StockChart.svelte";

// The row type is not inferred through `render`, so the component is widened.
type AnyChart = ComponentType<SvelteComponent<Record<string, unknown>>>;

const days = Array.from({ length: 40 }, (_, i) => {
  const open = 100 + Math.sin(i / 5) * 8;
  const close = open + (i % 3 === 0 ? -1.5 : 1);
  return {
    date: `D${i + 1}`,
    open,
    high: Math.max(open, close) + 1,
    low: Math.min(open, close) - 1,
    close,
    volume: 1000 + i * 10,
  };
});

describe("StockChart", () => {
  it("draws the price with overlays and volume, and a pane per indicator sharing the zoom", () => {
    render(StockChart as unknown as AnyChart, {
      props: {
        data: days,
        x: "date",
        open: "open",
        high: "high",
        low: "low",
        close: "close",
        volume: "volume",
        overlays: [
          { type: "sma", period: 5 },
          { type: "bollinger", period: 5 },
        ],
        indicators: [{ type: "rsi" }, { type: "macd" }],
        zoom: [10, 30],
        title: "ACME",
      },
    });

    const figures = screen.getAllByRole("figure", { hidden: true });
    expect(figures).toHaveLength(3);
    expect(figures[1]).toHaveAccessibleName("RSI 14");
    expect(figures[2]).toHaveAccessibleName("MACD 12/26/9");

    // The legend names the overlays only, one entry per overlay.
    const legend = screen.getByRole("group", { name: "Series" });
    expect(
      Array.from(legend.querySelectorAll(".bx--viz-legend__item")).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(["SMA 5", "BB 5"]);

    // Volume bars take the period's direction, so two colors appear.
    const volumeColors = new Set(
      Array.from(
        figures[0].querySelectorAll(
          ".bx--viz-stock__volume .bx--viz-bars__bar",
        ),
      ).map((el) =>
        (el as HTMLElement).style.getPropertyValue("--bx-viz-color"),
      ),
    );
    expect(volumeColors.size).toBe(2);
  });
});
