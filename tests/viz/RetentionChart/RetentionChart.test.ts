import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import RetentionChart from "./RetentionChart.test.svelte";

const labels = () =>
  Array.from(
    document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
  ).map((node) => node.textContent);

describe("RetentionChart", () => {
  it("runs the y axis from 0% to 100% and marks every period", () => {
    render(RetentionChart);

    expect(labels()).toEqual(expect.arrayContaining(["0%", "20%", "100%"]));
    expect(labels()).not.toContain("120%");
    expect(document.querySelectorAll(".bx--viz-line__point")).toHaveLength(8);
    expect(document.querySelectorAll(".bx--viz-line__path")).toHaveLength(2);
  });

  it("draws a baseline rule when one is given", () => {
    render(RetentionChart, { baseline: 0.35 });

    expect(document.querySelector(".bx--viz-threshold")).toHaveTextContent(
      "Baseline",
    );
    expect(
      document.querySelector(".bx--viz-threshold--warning"),
    ).not.toBeNull();
  });

  it("reports hover with the cohorts at the focused period", async () => {
    const onhover = vi.fn();
    render(RetentionChart, { onhover });

    screen.getByRole("application", { name: "Retention by cohort" }).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        x: 7,
        points: expect.arrayContaining([
          expect.objectContaining({ series: "Jan", y: 0.6 }),
          expect.objectContaining({ series: "Feb", y: 0.5 }),
        ]),
      }),
    );
  });
});
