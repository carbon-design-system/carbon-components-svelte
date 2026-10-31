import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import BeeswarmChart from "./BeeswarmChart.test.svelte";

const chart = () =>
  screen.getByRole("application", { name: "Latency by service" });
const groups = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-swarm__group"));
const dots = (group: SVGGElement) =>
  Array.from(group.querySelectorAll<SVGCircleElement>(".bx--viz-swarm__dot"));

describe("BeeswarmChart", () => {
  it("draws a dot per finite value, spreading ties sideways so none overlap", () => {
    render(BeeswarmChart);

    expect(groups()).toHaveLength(2);
    expect(dots(groups()[0])).toHaveLength(10);
    expect(dots(groups()[1])).toHaveLength(5);
    const web = dots(groups()[1]);
    const xs = new Set(web.slice(0, 4).map((dot) => dot.getAttribute("cx")));
    expect(xs.size).toBe(4);
    expect(web.every((dot) => dot.getAttribute("r") === "3")).toBe(true);
  });

  it("grows the y domain so every value fits", () => {
    render(BeeswarmChart);

    const labels = Array.from(
      document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
    ).map((n) => Number(n.textContent));
    expect(Math.max(...labels)).toBeGreaterThanOrEqual(300);
    expect(Math.min(...labels)).toBeLessThanOrEqual(10);
    const dots = Array.from(document.querySelectorAll(".bx--viz-swarm__dot"));
    expect(dots.every((dot) => Number(dot.getAttribute("cy")) >= 0)).toBe(true);
  });

  it("reads out the summary for the focused group, dimming the rest, and takes a radius", async () => {
    render(BeeswarmChart, { radius: 5 });

    expect(dots(groups()[0])[0].getAttribute("r")).toBe("5");
    chart().focus();
    await user.keyboard("{ArrowRight}");
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("api");
    expect(tooltip).toHaveTextContent(/Median\s*55/);
    expect(
      document.querySelectorAll(".bx--viz-swarm__group--dimmed"),
    ).toHaveLength(1);
  });
});
