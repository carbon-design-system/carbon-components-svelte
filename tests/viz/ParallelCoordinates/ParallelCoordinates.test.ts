import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ParallelCoordinates from "./ParallelCoordinates.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/ParallelCoordinates/parallel-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/ParallelCoordinates/parallel-geometry.js")
      >();
    return {
      ...actual,
      buildParallel: (...args: Parameters<typeof actual.buildParallel>) => {
        geometry.calls += 1;
        return actual.buildParallel(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Instances" });
const lines = () =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".bx--viz-parallel__line"),
  );
const axisLabels = () =>
  Array.from(document.querySelectorAll(".bx--viz-parallel__label")).map(
    (node) => node.textContent?.trim(),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("ParallelCoordinates", () => {
  it("draws an axis per dimension and a line per row", () => {
    render(ParallelCoordinates);

    expect(axisLabels()).toEqual(["cpu", "mem", "Cost"]);
    expect(lines()).toHaveLength(3);
    expect(lines()[0].getAttribute("d")).toMatch(/^M40,/);
    expect(lines()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      lines()[1].style.getPropertyValue("--bx-viz-color"),
    );
  });

  it("gives assistive technology every row as a table, with a dash for a missing value", () => {
    render(ParallelCoordinates);

    const table = screen.getByRole("table", { name: "Instances" });
    const rows = within(table)
      .getAllByRole("row")
      .map((row) =>
        Array.from(row.children).map((cell) => cell.textContent?.trim()),
      );
    expect(rows).toEqual([
      ["Row", "cpu", "mem", "Cost"],
      ["a", "10", "4", "20"],
      ["b", "30", "8", "45"],
      ["c", "90", "–", "200"],
    ]);
  });

  it("moves row to row with the keyboard, without rebuilding the geometry", async () => {
    const onhover = vi.fn();
    const onselect = vi.fn();
    render(ParallelCoordinates, { onhover, onselect });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 1, label: "b", series: "small" }),
    );
    expect(lines()[1]).toHaveClass("bx--viz-parallel__line--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "b: cpu 30, mem 8, Cost 45",
    );
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /Cost\s*45/,
    );

    await user.keyboard("{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        line: expect.objectContaining({ label: "b" }),
      }),
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("fades rows outside a brush and reports the rows that pass", async () => {
    const onbrush = vi.fn();
    const { rerender } = render(ParallelCoordinates, { onbrush });

    await rerender({ brushes: { cpu: [0, 50] } });
    expect(
      lines().map((line) =>
        line.classList.contains("bx--viz-parallel__line--faded"),
      ),
    ).toEqual([false, false, true]);
    expect(document.querySelectorAll(".bx--viz-parallel__brush")).toHaveLength(
      1,
    );
  });

  it("brushes an axis by dragging along it and clears it with a double click", async () => {
    const onbrush = vi.fn();
    render(ParallelCoordinates, { onbrush });
    const svg = chart();
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 400, height: 240 }) as DOMRect;
    const hit = document.querySelectorAll(".bx--viz-parallel__hit")[0];

    await fireEvent.pointerDown(hit, {
      button: 0,
      clientX: 40,
      clientY: 216,
      pointerId: 1,
    });
    await fireEvent.pointerMove(svg, { clientX: 40, clientY: 126 });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await fireEvent.pointerUp(svg);

    const brushed = JSON.parse(
      screen.getByTestId("brushes").textContent ?? "{}",
    );
    expect(brushed.cpu[0]).toBeCloseTo(0, 0);
    expect(brushed.cpu[1]).toBeCloseTo(50, 0);
    expect(onbrush).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ name: "a" })]),
      }),
    );
    expect(onbrush.mock.calls.at(-1)?.[0].data).toHaveLength(2);

    await fireEvent.dblClick(hit);
    expect(screen.getByTestId("brushes")).toHaveTextContent("{}");
  });

  it("hides a series from the legend, but never the last one", async () => {
    render(ParallelCoordinates);

    const legend = screen.getByRole("group", { name: "Series" });
    await user.click(within(legend).getByRole("button", { name: "large" }));
    expect(screen.getByTestId("hidden")).toHaveTextContent("large");
    expect(lines()).toHaveLength(2);

    await user.click(within(legend).getByRole("button", { name: "small" }));
    expect(screen.getByTestId("hidden")).toHaveTextContent("large");
  });
});
