import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ViolinPlot from "./ViolinPlot.test.svelte";

const chart = () =>
  screen.getByRole("application", { name: "Latency by service" });

describe("ViolinPlot", () => {
  it("draws a violin per group with a quartile box and median inside", () => {
    render(ViolinPlot);

    const violins = document.querySelectorAll(".bx--viz-violins__violin");
    expect(violins).toHaveLength(2);
    expect(
      violins[0].querySelector(".bx--viz-violins__body")?.getAttribute("d"),
    ).toMatch(/^M.*Z$/);
    expect(violins[0].querySelectorAll(".bx--viz-violins__box")).toHaveLength(
      1,
    );
    expect(
      violins[0].querySelectorAll(".bx--viz-violins__median"),
    ).toHaveLength(1);
  });

  it("grows the y domain so the curve's tails fit, without forcing zero", () => {
    render(ViolinPlot);

    const labels = Array.from(
      document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
    ).map((n) => Number(n.textContent));
    expect(Math.max(...labels)).toBeGreaterThanOrEqual(300);
    const body = document.querySelector(".bx--viz-violins__body");
    const ys =
      body
        ?.getAttribute("d")
        ?.match(/,([\d.]+)/g)
        ?.map((m) => Number(m.slice(1))) ?? [];
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
  });

  it("reads out the five statistics and the count for the focused group, dimming the rest", async () => {
    render(ViolinPlot);

    chart().focus();
    await user.keyboard("{ArrowRight}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("api");
    for (const text of [/Median\s*55/, /Count\s*10/]) {
      expect(tooltip).toHaveTextContent(text);
    }
    expect(
      document.querySelectorAll(".bx--viz-violins__violin--dimmed"),
    ).toHaveLength(1);
  });

  it("can drop the inner summary", () => {
    render(ViolinPlot, { inner: false });
    expect(document.querySelectorAll(".bx--viz-violins__box")).toHaveLength(0);
    expect(document.querySelectorAll(".bx--viz-violins__body")).toHaveLength(2);
  });
});
