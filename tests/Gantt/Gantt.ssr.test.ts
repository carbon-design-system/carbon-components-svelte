// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import GanttSsr from "./GanttSsr.test.svelte";

describe("Gantt server render", () => {
  it("renders the axis, the bars and the links without a browser", () => {
    const { document } = renderSSR(GanttSsr);

    expect(document.querySelectorAll("[data-gantt-id]")).toHaveLength(3);
    expect(document.querySelectorAll(".bx--gantt__link")).toHaveLength(1);
    expect(
      document.querySelector(".bx--gantt__axis-tier")?.textContent,
    ).toContain("March 2026");
    expect(document.body.innerHTML).not.toContain("undefined");
  });

  it("gives the first bar the only tab stop", () => {
    const { document } = renderSSR(GanttSsr);
    const stops = document.querySelectorAll("[data-gantt-id][tabindex='0']");

    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAttribute("data-gantt-id", "plan");
  });

  it("draws the today line only when the consumer names the day", () => {
    expect(
      renderSSR(GanttSsr).document.querySelector(".bx--gantt__today"),
    ).toBeNull();
    expect(
      renderSSR(GanttSsr, { today: "2026-03-04" }).document.querySelector(
        ".bx--gantt__today",
      ),
    ).not.toBeNull();
  });
});
