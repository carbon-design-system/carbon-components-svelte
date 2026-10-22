import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import IcicleChart from "./IcicleChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/utils/partition.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/utils/partition.js")
    >();
  return {
    ...actual,
    partition: (...args: Parameters<typeof actual.partition>) => {
      geometry.calls += 1;
      return actual.partition(...args);
    },
  };
});

const nodes = () =>
  Array.from(
    screen
      .getByTestId("icicle")
      .querySelectorAll<HTMLElement>(".bx--viz-icicle__node"),
  );
const named = (label: string) =>
  nodes().find((node) => node.title.startsWith(`${label}:`)) as HTMLElement;

beforeEach(() => {
  geometry.calls = 0;
});

describe("IcicleChart", () => {
  it("places each node in the row of its depth, sized by its share", () => {
    render(IcicleChart);

    expect(nodes()).toHaveLength(8);
    expect(named("bundle").style.top).toBe("0px");
    expect(named("bundle").style.width).toBe("100%");
    expect(named("src").style.top).toBe("20px");
    expect(named("src").style.left).toBe("0%");
    expect(named("viz").style.top).toBe("40px");
    expect(Number.parseFloat(named("viz").style.width)).toBeCloseTo(
      (410 / 1200) * 100,
      3,
    );
    expect(named("viz")).toHaveAttribute("title", "viz: 410");
    expect(
      (
        screen
          .getByTestId("icicle")
          .querySelector(".bx--viz-icicle__plot") as HTMLElement
      ).style.height,
    ).toBe("60px");
  });

  it("drops the value, then the label, as a slice narrows", () => {
    render(IcicleChart);

    expect(named("src")).not.toHaveClass("bx--viz-icicle__node--short");
    expect(named("css")).toHaveClass("bx--viz-icicle__node--short");
    expect(named("css")).not.toHaveClass("bx--viz-icicle__node--narrow");
    expect(
      named("css").querySelector(".bx--viz-icicle__value"),
    ).toHaveTextContent("60");
  });

  it("stands on its head as a flame graph", () => {
    render(IcicleChart, { orientation: "bottom" });

    expect(named("bundle").style.top).toBe("40px");
    expect(named("viz").style.top).toBe("0px");
    expect(screen.getByTestId("icicle")).toHaveClass("bx--viz-icicle--flame");
  });

  it("colors by the branch under the root and lists the branches", () => {
    render(IcicleChart);

    const color = (label: string) =>
      named(label).style.getPropertyValue("--bx-viz-color");
    expect(color("viz")).toBe(color("src"));
    expect(color("css")).toBe(color("assets"));
    expect(color("src")).not.toBe(color("vendor"));
    expect(color("bundle")).toBe("var(--cds-viz-neutral)");
    expect(
      within(screen.getByTestId("icicle"))
        .getAllByRole("listitem", { hidden: true })
        .filter((item) =>
          item.classList.contains("bx--viz-treemap__legend-item"),
        )
        .map((item) => item.textContent?.trim()),
    ).toEqual(["src", "vendor", "assets"]);
  });

  it("drills to a root and keeps its ancestors as dimmed full-width steps", async () => {
    const { rerender } = render(IcicleChart);

    await rerender({ root: "src" });
    expect(nodes().map((node) => node.title.split(":")[0])).toEqual([
      "bundle",
      "src",
      "viz",
      "core",
    ]);
    expect(named("bundle")).toHaveClass("bx--viz-icicle__node--ancestor");
    expect(named("src").style.width).toBe("100%");
    expect(Number.parseFloat(named("viz").style.width)).toBeCloseTo(
      (410 / 640) * 100,
      3,
    );
  });

  it("gives assistive technology every node as a table with level, value, and share", () => {
    render(IcicleChart);

    const table = screen.getByRole("table", { name: "Bundle composition" });
    const rows = within(table)
      .getAllByRole("row")
      .map((row) =>
        Array.from(row.children).map((cell) => cell.textContent?.trim()),
      );
    expect(rows[0]).toEqual(["Node", "Level", "Value", "Share"]);
    expect(rows[1]).toEqual(["bundle", "1", "1.2K", "100%"]);
    expect(rows[3]).toEqual(["viz", "3", "410", "34%"]);
  });

  it("follows the hovered node without laying out again", async () => {
    const onhover = vi.fn();
    render(IcicleChart, { onhover });
    const built = geometry.calls;

    await fireEvent.mouseEnter(named("vendor"));
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "vendor",
        value: 380,
        depth: 1,
        leaf: true,
      }),
    );
    expect(screen.getByTestId("icicle")).toHaveClass(
      "bx--viz-icicle--emphasis",
    );
    expect(geometry.calls).toBe(built);
    await fireEvent.mouseLeave(named("vendor"));
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("selects a node, with one tab stop and arrow keys between nodes", async () => {
    const onselect = vi.fn();
    render(IcicleChart, { selectable: true, onselect });

    const buttons = within(screen.getByTestId("icicle")).getAllByRole("button");
    expect(buttons).toHaveLength(8);
    expect(buttons.map((button) => button.tabIndex)).toEqual([
      0, -1, -1, -1, -1, -1, -1, -1,
    ]);
    expect(buttons[2]).toHaveAccessibleName("viz, 410");
    expect(screen.queryByRole("table")).toBeNull();

    buttons[0].focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        node: expect.objectContaining({ id: "src", value: 640 }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("src");
    expect(named("src")).toHaveClass("bx--viz-icicle__node--selected");
  });
});
