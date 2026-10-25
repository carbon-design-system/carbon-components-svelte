import { render } from "@testing-library/svelte";
import type { ComponentType, SvelteComponent } from "svelte";
import ParetoChart from "../../../src/viz/ParetoChart/ParetoChart.svelte";

type AnyChart = ComponentType<SvelteComponent<Record<string, unknown>>>;

describe("ParetoChart", () => {
  it("sorts the bars largest first, runs a cumulative share to 100% on the right axis, and draws the threshold", () => {
    render(ParetoChart as unknown as AnyChart, {
      props: {
        data: [
          { cause: "Timeout", tickets: 10 },
          { cause: "Crash", tickets: 50 },
          { cause: "Typo", tickets: 5 },
          { cause: "Login", tickets: 35 },
        ],
        x: "cause",
        y: "tickets",
        title: "Tickets by cause",
        width: 600,
      },
    });
    const labels = Array.from(
      document.querySelectorAll(".bx--viz-axis--bottom .bx--viz-axis__label"),
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(["Crash", "Login", "Timeout", "Typo"]);
    const right = Array.from(
      document.querySelectorAll(".bx--viz-axis--right .bx--viz-axis__label"),
    ).map((el) => el.textContent?.trim());
    expect(right.at(-1)).toBe("100%");
    expect(
      document.querySelector(".bx--viz-threshold__label"),
    ).toHaveTextContent("80%");
    expect(document.querySelectorAll(".bx--viz-bars__bar")).toHaveLength(4);
    expect(document.querySelectorAll(".bx--viz-line__path")).toHaveLength(1);
  });
});
