import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import DumbbellChart from "./DumbbellChart.test.svelte";

const chart = () => screen.getByRole("application", { name: "Scores by team" });
const pairs = () =>
  Array.from(
    document.querySelectorAll<SVGGElement>(".bx--viz-dumbbells__pair"),
  );
const labels = (side: string) =>
  Array.from(
    document.querySelectorAll(`.bx--viz-axis--${side} .bx--viz-axis__label`),
  ).map((node) => node.textContent?.trim());

describe("DumbbellChart", () => {
  it("lists categories down the left, with a pair per category, not from zero", () => {
    render(DumbbellChart);

    expect(labels("left")).toEqual(["Web", "Data"]);
    expect(labels("bottom")[0]).not.toBe("0");
    expect(pairs()).toHaveLength(2);
    expect(pairs()[0]).toHaveClass("bx--viz-dumbbells__pair--up");
    expect(pairs()[1]).toHaveClass("bx--viz-dumbbells__pair--down");
    const bar = pairs()[0].querySelector(".bx--viz-dumbbells__bar");
    expect(bar?.getAttribute("y1")).toBe(bar?.getAttribute("y2"));
  });

  it("stands up when vertical", () => {
    render(DumbbellChart, { orientation: "vertical" });

    expect(labels("bottom")).toEqual(["Web", "Data"]);
    const bar = pairs()[0].querySelector(".bx--viz-dumbbells__bar");
    expect(bar?.getAttribute("x1")).toBe(bar?.getAttribute("x2"));
  });

  it("reads both values of the focused category, dimming the rest", async () => {
    render(DumbbellChart);

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("Data");
    expect(tooltip).toHaveTextContent(/2025\s*71/);
    expect(tooltip).toHaveTextContent(/2026\s*65/);
    expect(
      pairs().filter((pair) =>
        pair.classList.contains("bx--viz-dumbbells__pair--dimmed"),
      ),
    ).toHaveLength(1);
  });
});
