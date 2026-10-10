import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChartDensity from "./ChartDensity.test.svelte";

const chart = () => screen.getByRole("application", { name: "Density" });
const cells = () =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".bx--viz-hexbin__cell"),
  );
const dots = () =>
  Array.from(document.querySelectorAll(".bx--viz-points__point"));

describe("ScatterChart density", () => {
  it("bins the points into hexagons colored by count, faded points behind", () => {
    render(ChartDensity);

    expect(cells().length).toBeGreaterThan(1);
    const counts = cells().map((cell) =>
      Number(cell.querySelector("title")?.textContent),
    );
    expect(counts.reduce((sum, n) => sum + n, 0)).toBe(42);
    const busiest = cells()[counts.indexOf(Math.max(...counts))];
    expect(busiest.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-11)",
    );
    expect(document.querySelector(".bx--viz-points")).toHaveClass(
      "bx--viz-points--behind",
    );
    expect(dots()).toHaveLength(42);
    // Cells are drawn before the points.
    const svg = chart();
    const hex = svg.querySelector(".bx--viz-hexbin") as Element;
    const pts = svg.querySelector(".bx--viz-points") as Element;
    expect(
      hex.compareDocumentPosition(pts) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("lights the cell of the hovered point and keeps hover working with the points hidden", async () => {
    render(ChartDensity, { points: "none" });

    expect(dots()).toHaveLength(0);
    chart().focus();
    await user.keyboard("{ArrowRight}");
    expect(
      document.querySelectorAll(".bx--viz-hexbin__cell--active"),
    ).toHaveLength(1);
    // The active point alone is drawn, so the tooltip has an anchor.
    expect(dots()).toHaveLength(1);
    expect(document.querySelector(".bx--viz-chart-tooltip")).not.toBeNull();
  });

  it("draws contour lines at increasing levels, colored low to high", () => {
    render(ChartDensity, { density: "contour" });

    const lines = Array.from(
      document.querySelectorAll<SVGPathElement>(".bx--viz-contours__line"),
    );
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(4);
    expect(lines[0].getAttribute("d")).toMatch(/^M[\d.]+,[\d.]+L/);
    expect(lines[0].style.getPropertyValue("--bx-viz-color")).not.toBe(
      lines[lines.length - 1].style.getPropertyValue("--bx-viz-color"),
    );
    expect(cells()).toHaveLength(0);
    expect(
      document.querySelector(".bx--viz-contours")?.getAttribute("transform"),
    ).toMatch(/^translate\(/);
  });

  it("draws nothing extra without a density", () => {
    render(ChartDensity, { density: "none" });
    expect(cells()).toHaveLength(0);
    expect(document.querySelector(".bx--viz-contours")).toBeNull();
    expect(document.querySelector(".bx--viz-points")).not.toHaveClass(
      "bx--viz-points--behind",
    );
  });
});
