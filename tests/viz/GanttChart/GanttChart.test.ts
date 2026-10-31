import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type { ComponentType, SvelteComponent } from "svelte";
import GanttChartRaw from "../../../src/viz/GanttChart/GanttChart.svelte";
import { user } from "../../utils/user";
import GanttChart from "./GanttChart.test.svelte";

// The row type is not inferred through `render`, so the component is widened.
type AnyChart = ComponentType<SvelteComponent<Record<string, unknown>>>;

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/GanttChart/gantt-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/GanttChart/gantt-geometry.js")
      >();
    return {
      ...actual,
      buildGantt: (...args: Parameters<typeof actual.buildGantt>) => {
        geometry.calls += 1;
        return actual.buildGantt(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Launch plan" });
const tasks = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-gantt__task"));

beforeEach(() => {
  geometry.calls = 0;
});

describe("GanttChart", () => {
  it("draws a bar per task with its progress, grouped and linked", () => {
    render(GanttChart);

    expect(tasks()).toHaveLength(3);
    expect(
      tasks().map((task) =>
        task.querySelector(".bx--viz-gantt__label")?.textContent?.trim(),
      ),
    ).toEqual(["spec", "checkout API", "storefront"]);
    const bar = tasks()[1].querySelector(".bx--viz-gantt__bar");
    const done = tasks()[1].querySelector(".bx--viz-gantt__done");
    expect(Number(done?.getAttribute("width"))).toBeCloseTo(
      Number(bar?.getAttribute("width")) / 2,
      5,
    );
    expect(tasks()[2].querySelector(".bx--viz-gantt__done")).toBeNull();
    expect(document.querySelectorAll(".bx--viz-gantt__link")).toHaveLength(2);
    expect(
      document.querySelectorAll(".bx--viz-gantt__link--late"),
    ).toHaveLength(1);
    expect(
      Array.from(document.querySelectorAll(".bx--viz-gantt__group-label")).map(
        (n) => n.textContent?.trim(),
      ),
    ).toEqual(["Design", "API", "Web"]);
  });

  it("marks today when it is inside the range", async () => {
    const { rerender } = render(GanttChart);
    expect(document.querySelector(".bx--viz-gantt__today")).toBeNull();

    await rerender({ today: new Date(2026, 8, 12) });
    expect(document.querySelector(".bx--viz-gantt__today")).not.toBeNull();
    expect(
      document.querySelector(".bx--viz-gantt__today-label"),
    ).toHaveTextContent("Today");
  });

  it("gives assistive technology every task as a table", () => {
    render(GanttChart);

    const table = screen.getByRole("table", { name: "Launch plan" });
    const rows = within(table)
      .getAllByRole("row")
      .map((row) =>
        Array.from(row.children).map((cell) =>
          cell.textContent?.replace(/\s+/g, " ").trim(),
        ),
      );
    expect(rows[0]).toEqual([
      "Task",
      "Workstream",
      "Start",
      "End",
      "Done",
      "Waits for",
    ]);
    expect(rows[2]).toEqual([
      "checkout API",
      "API",
      "Sep 8, 2026",
      "Sep 18, 2026",
      "50%",
      "spec",
    ]);
    expect(rows[3]).toEqual([
      "storefront",
      "Web",
      "Sep 14, 2026",
      "Sep 24, 2026",
      "–",
      "checkout API",
    ]);
  });

  it("moves task by task with the keyboard, without laying out again", async () => {
    const onhover = vi.fn();
    const onselect = vi.fn();
    render(GanttChart, { onhover, onselect });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "api",
        label: "checkout API",
        progress: 0.5,
      }),
    );
    expect(tasks()[1]).toHaveClass("bx--viz-gantt__task--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "checkout API, API, Sep 8, 2026 to Sep 18, 2026, 10d, 50% done",
    );
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /Done\s*50%/,
    );

    await user.keyboard("{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ task: expect.objectContaining({ id: "api" }) }),
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("follows the pointer onto a task", async () => {
    const onhover = vi.fn();
    render(GanttChart, { onhover });

    await fireEvent.mouseEnter(tasks()[2]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "web" }),
    );
  });

  it("pins the tooltip on click and releases it with Escape", async () => {
    const onhover = vi.fn();
    render(GanttChart, { onhover });
    chart().focus();
    await user.keyboard("{ArrowDown}");
    expect(document.querySelector(".bx--viz-chart-tooltip")).not.toBeNull();

    await fireEvent.click(chart());
    await fireEvent.pointerLeave(chart());
    expect(document.querySelector(".bx--viz-chart-tooltip")).not.toBeNull();
    expect(onhover).not.toHaveBeenLastCalledWith(null);

    await user.keyboard("{Escape}");
    expect(document.querySelector(".bx--viz-chart-tooltip")).toBeNull();
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("fits a narrow container: labels cut to their column, ticks kept apart", () => {
    render(GanttChartRaw as unknown as AnyChart, {
      props: {
        data: [
          {
            id: "a",
            name: "Specification of the launch",
            stream: "Design",
            from: new Date(2026, 8, 1),
            to: new Date(2026, 8, 8),
          },
          {
            id: "b",
            name: "Build",
            stream: "API",
            from: new Date(2026, 8, 6),
            to: new Date(2026, 8, 20),
          },
        ],
        id: "id",
        label: "name",
        group: "stream",
        start: "from",
        end: "to",
        width: 240,
        title: "Narrow",
      },
    });

    const labels = Array.from(
      document.querySelectorAll(".bx--viz-gantt__label"),
    ).map((el) => el.textContent?.trim());
    expect(labels[0]).toMatch(/…$/);
    expect(labels[0]?.length).toBeLessThan(12);
    expect(labels[1]).toBe("Build");
    expect(
      document.querySelectorAll(".bx--viz-gantt__tick").length,
    ).toBeLessThanOrEqual(2);
  });
});
