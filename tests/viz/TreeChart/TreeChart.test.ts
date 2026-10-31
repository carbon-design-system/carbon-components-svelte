import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import TreeChart from "./TreeChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/TreeChart/tree-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/TreeChart/tree-geometry.js")
      >();
    return {
      ...actual,
      buildTree: (...args: Parameters<typeof actual.buildTree>) => {
        geometry.calls += 1;
        return actual.buildTree(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Org chart" });
const labels = () =>
  Array.from(document.querySelectorAll(".bx--viz-tree__label")).map((node) =>
    node.textContent?.trim(),
  );
const live = () => document.querySelector("[aria-live]");

beforeEach(() => {
  geometry.calls = 0;
});

describe("TreeChart", () => {
  it("draws a node per row and a link per child", () => {
    render(TreeChart);

    expect(labels()).toEqual([
      "Company",
      "Engineering",
      "Web",
      "API",
      "Operations",
    ]);
    expect(document.querySelectorAll(".bx--viz-tree__link")).toHaveLength(4);
  });

  it("lists the visible nodes with their level and state for assistive technology", () => {
    render(TreeChart, { collapsed: ["eng"] });

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent?.trim()),
    ).toEqual([
      "Company, level 1, expanded",
      "Engineering, level 2, collapsed",
      "Operations, level 2",
    ]);
  });

  it("walks the tree like a tree view, without a rebuild until something folds", async () => {
    const ontoggle = vi.fn();
    render(TreeChart, { ontoggle });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(live()).toHaveTextContent("Engineering, level 2, expanded");
    // Right steps into an open branch.
    await user.keyboard("{ArrowRight}");
    expect(live()).toHaveTextContent("Web, level 3");
    // Left steps out of a leaf, to its parent.
    await user.keyboard("{ArrowLeft}");
    expect(live()).toHaveTextContent("Engineering, level 2, expanded");
    expect(geometry.calls).toBe(built);

    // Left on an open branch folds it.
    await user.keyboard("{ArrowLeft}");
    expect(ontoggle).toHaveBeenLastCalledWith({ id: "eng", collapsed: true });
    expect(screen.getByTestId("collapsed")).toHaveTextContent("eng");
    expect(labels()).toEqual(["Company", "Engineering", "Operations"]);
    expect(live()).toHaveTextContent("Engineering, level 2, collapsed");

    // Right opens it again.
    await user.keyboard("{ArrowRight}");
    expect(ontoggle).toHaveBeenLastCalledWith({ id: "eng", collapsed: false });
    expect(labels()).toHaveLength(5);
  });

  it("folds a branch and fires select on click", async () => {
    const onselect = vi.fn();
    render(TreeChart, { onselect });

    const engineering = document.querySelectorAll(".bx--viz-tree__node")[1];
    await user.click(engineering);
    expect(onselect.mock.calls[0][0]).toMatchObject({
      node: { id: "eng", label: "Engineering" },
    });
    expect(screen.getByTestId("collapsed")).toHaveTextContent("eng");
    expect(engineering).toHaveClass("bx--viz-tree__node--collapsed");
  });
});
