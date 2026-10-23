import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import TreemapChart from "./TreemapChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/TreemapChart/treemap-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/TreemapChart/treemap-geometry.js")
      >();
    return {
      ...actual,
      buildTreemap: (...args: Parameters<typeof actual.buildTreemap>) => {
        geometry.calls += 1;
        return actual.buildTreemap(...args);
      },
    };
  },
);

const leaves = () =>
  Array.from(document.querySelectorAll<HTMLElement>(".bx--viz-treemap__leaf"));
const text = (node: Element) => node.textContent?.replace(/\s+/g, " ").trim();

beforeEach(() => {
  geometry.calls = 0;
});

describe("TreemapChart", () => {
  it("is nested lists: groups, then their cells, largest first", () => {
    render(TreemapChart);

    const figure = screen.getByTestId("treemap");
    expect(figure.querySelector("figcaption")).toHaveTextContent("Cloud spend");
    const groups = figure.querySelectorAll(".bx--viz-treemap__group");
    expect(Array.from(groups).map((g) => text(g)?.split(" ")[0])).toEqual([
      "Platform",
      "Data",
      "Web",
    ]);
    expect(leaves().map(text)).toEqual([
      "compute 4K",
      "storage 2K",
      "warehouse 4K",
      "cdn 50",
    ]);
  });

  it("sizes cells in percentages and colors them by group", () => {
    render(TreemapChart);

    const [compute, storage] = leaves();
    const area = (node: HTMLElement) =>
      Number.parseFloat(node.style.width) *
      Number.parseFloat(node.style.height);
    expect(area(compute) / area(storage)).toBeCloseTo(2);
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>(".bx--viz-treemap__group"),
    );
    expect(
      new Set(groups.map((g) => g.style.getPropertyValue("--bx-viz-color")))
        .size,
    ).toBe(3);
  });

  it("hides the text of a cell too small to hold it, but keeps it in the DOM", () => {
    render(TreemapChart);

    const cdn = leaves()[3];
    expect(cdn).toHaveClass("bx--viz-treemap__leaf--tiny");
    expect(cdn).toHaveTextContent("cdn");
    expect(cdn).toHaveAttribute("title", "cdn: 50");
    expect(leaves()[0]).not.toHaveClass("bx--viz-treemap__leaf--tiny");
  });

  it("lists groups in a legend, and has none without groups", () => {
    const { unmount } = render(TreemapChart);
    expect(
      Array.from(
        document.querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map(text),
    ).toEqual(["Platform", "Data", "Web"]);
    unmount();

    render(TreemapChart, { grouped: false, valueType: "percent" });
    expect(document.querySelector(".bx--viz-treemap__legend")).toBeNull();
    expect(leaves().map(text)).toEqual([
      "compute 40%",
      "warehouse 40%",
      "storage 20%",
      "cdn 1%",
    ]);
  });

  it("follows the hovered cell without rebuilding the layout", async () => {
    const onhover = vi.fn();
    render(TreemapChart, { onhover });
    const built = geometry.calls;

    await user.hover(leaves()[2]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "Data/warehouse", value: 3950 }),
    );
    expect(leaves()[2]).toHaveClass("bx--viz-treemap__leaf--active");
    expect(screen.getByTestId("treemap")).toHaveClass(
      "bx--viz-treemap--emphasis",
    );
    expect(geometry.calls).toBe(built);
  });

  it("renders no buttons unless selectable", () => {
    render(TreemapChart);

    expect(
      within(screen.getByTestId("treemap")).queryAllByRole("button"),
    ).toEqual([]);
  });

  it("selects a cell, with one tab stop and arrow keys between cells", async () => {
    const onselect = vi.fn();
    render(TreemapChart, { selectable: true, onselect });

    const buttons = within(screen.getByTestId("treemap")).getAllByRole(
      "button",
    );
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);

    buttons[0].focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(buttons[2]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("Data/warehouse");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      leaf: { key: "warehouse", group: "Data" },
    });
  });
});
