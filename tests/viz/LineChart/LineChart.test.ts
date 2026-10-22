import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import LineChart from "./LineChart.test.svelte";

const chart = () => screen.getByRole("application", { name: "Revenue" });
const yLabels = () =>
  Array.from(
    document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
  ).map((node) => node.textContent);

describe("LineChart", () => {
  it("composes grid, axes, lines, and a legend", () => {
    render(LineChart);

    expect(document.querySelectorAll(".bx--viz-line__path")).toHaveLength(2);
    expect(document.querySelector(".bx--viz-grid")).not.toBeNull();
    expect(document.querySelectorAll(".bx--viz-axis")).toHaveLength(2);
    expect(screen.getByRole("group", { name: "Series" })).toBeInTheDocument();
  });

  it("forwards Chart props and attributes", () => {
    render(LineChart);

    expect(chart()).toHaveAttribute("viewBox", "0 0 640 240");
    expect(screen.getByTestId("chart").tagName).toBe("FIGURE");
  });

  it("fits the data by default, and includes zero on request", async () => {
    const { rerender } = render(LineChart);
    expect(yLabels()[0]).toBe("40");

    await rerender({ zero: true });
    expect(yLabels()[0]).toBe("0");
  });

  it("can drop the grid, the legend, and the tooltip", async () => {
    render(LineChart, { grid: false, legend: false, tooltip: false });

    expect(document.querySelector(".bx--viz-grid")).toBeNull();
    expect(screen.queryByRole("group", { name: "Series" })).toBeNull();

    chart().focus();
    await user.keyboard("{ArrowRight}");
    expect(document.querySelector(".bx--viz-chart-tooltip")).toBeNull();
    expect(document.querySelector(".bx--viz-ruler")).toBeNull();
  });

  it("shows the tooltip and ruler for the focused point", async () => {
    render(LineChart);

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.querySelector(".bx--viz-ruler")).not.toBeNull();
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      "a",
    );
  });

  it("passes the curve to the lines and the title to the axis", () => {
    render(LineChart, { curve: "monotone", yTitle: "Revenue (USD)" });

    expect(
      document.querySelector(".bx--viz-line__path")?.getAttribute("d"),
    ).toContain("C");
    expect(document.querySelector(".bx--viz-axis--left")).toHaveTextContent(
      "Revenue (USD)",
    );
  });

  it("renders extra marks from the default slot", () => {
    render(LineChart, { withThreshold: true });

    expect(document.querySelector(".bx--viz-threshold")).toHaveTextContent(
      "Target",
    );
    expect(yLabels().at(-1)).toBe("200");
  });

  it("forwards select and legend:toggle, and binds hidden", async () => {
    const onselect = vi.fn();
    const ontoggle = vi.fn();
    render(LineChart, { onselect, ontoggle });

    chart().focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ series: "a", index: 0 }),
    );

    await user.click(screen.getByRole("button", { name: "b" }));
    expect(ontoggle).toHaveBeenCalledWith({ series: "b", hidden: true });
    expect(screen.getByTestId("hidden")).toHaveTextContent("b");
    expect(document.querySelectorAll(".bx--viz-line__path")).toHaveLength(1);
  });
});
