import { render, screen, waitFor, within } from "@testing-library/svelte";
import type TreeViewGridComponent from "carbon-components-svelte/TreeViewGrid/TreeViewGrid.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeViewGrid from "./TreeViewGrid.test.svelte";

/** Press a key, then wait for focus to land on `element()`. */
async function press(keys: string, element: () => HTMLElement) {
  await user.keyboard(keys);
  await waitFor(() => expect(element()).toHaveFocus());
}

const cell = (rowId: string, index: number) =>
  (treeItemById(rowId) as HTMLTableRowElement).cells[index];

const expandedOutput = () => screen.getByTestId("expanded");
const selectedOutput = () => screen.getByTestId("selected");

describe("TreeViewGrid", () => {
  describe("roles and levels", () => {
    it("exposes a treegrid with column headers, row headers and cells", () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod", "web"] } });

      const grid = screen.getByRole("treegrid", { name: "Servers" });
      expect(within(grid).getAllByRole("columnheader")).toHaveLength(3);
      // 8 rows are visible with `prod` and `web` open.
      expect(within(grid).getAllByRole("rowheader")).toHaveLength(8);
      expect(within(grid).getAllByRole("gridcell")).toHaveLength(8 * 2);
    });

    it("sets level, position and set size on flat rows", () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod", "web"] } });

      expect(treeItemById("prod")).toHaveAttribute("aria-level", "1");
      expect(treeItemById("prod")).toHaveAttribute("aria-posinset", "1");
      expect(treeItemById("prod")).toHaveAttribute("aria-setsize", "3");
      expect(treeItemById("web-2")).toHaveAttribute("aria-level", "3");
      expect(treeItemById("web-2")).toHaveAttribute("aria-posinset", "2");
      expect(treeItemById("web-2")).toHaveAttribute("aria-setsize", "2");
      expect(treeItemById("db")).toHaveAttribute("aria-level", "2");
      expect(treeItemById("db")).toHaveAttribute("aria-posinset", "3");
    });

    it("puts aria-expanded on expandable rows only", () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod"] } });

      expect(treeItemById("prod")).toHaveAttribute("aria-expanded", "true");
      expect(treeItemById("web")).toHaveAttribute("aria-expanded", "false");
      expect(treeItemById("db")).not.toHaveAttribute("aria-expanded");
    });

    it("renders no rows below a collapsed parent", () => {
      render(TreeViewGrid);

      expect(document.querySelector('[data-tree-row-id="web"]')).toBeNull();
      expect(screen.getAllByRole("rowheader")).toHaveLength(3);
    });
  });

  describe("empty state", () => {
    it("shows emptyText in one cell across every column", () => {
      render(TreeViewGrid, {
        props: { nodes: [], emptyText: "No servers yet." },
      });

      const cells = within(screen.getByRole("treegrid")).getAllByRole(
        "gridcell",
      );
      expect(cells).toHaveLength(1);
      expect(cells[0]).toHaveAttribute("colspan", "3");
      expect(cells[0]).toHaveTextContent("No servers yet.");
    });

    it("renders no row without emptyText or an empty slot", () => {
      render(TreeViewGrid, { props: { nodes: [] } });

      expect(
        within(screen.getByRole("treegrid")).queryAllByRole("row"),
      ).toHaveLength(1);
    });

    it("hides emptyText while there are rows", () => {
      render(TreeViewGrid, { props: { emptyText: "No servers yet." } });

      expect(screen.queryByText("No servers yet.")).not.toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("expands on Right, enters the first cell, then returns and collapses on Left", async () => {
      render(TreeViewGrid);
      treeItemById("prod").focus();

      // Right on a collapsed row expands it. A Set mutated in place would
      // leave the children out.
      await user.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(treeItemById("prod")).toHaveAttribute("aria-expanded", "true"),
      );
      expect(treeItemById("web")).toBeInTheDocument();
      expect(treeItemById("prod")).toHaveFocus();

      await press("{ArrowRight}", () => cell("prod", 0));
      await press("{ArrowRight}", () => cell("prod", 1));
      await press("{ArrowLeft}", () => cell("prod", 0));
      await press("{ArrowLeft}", () => treeItemById("prod"));

      await user.keyboard("{ArrowLeft}");
      await waitFor(() =>
        expect(treeItemById("prod")).toHaveAttribute("aria-expanded", "false"),
      );
      expect(document.querySelector('[data-tree-row-id="web"]')).toBeNull();
    });

    it("climbs to the parent on Left from a collapsed or leaf row", async () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod", "web"] } });
      treeItemById("web-1").focus();

      await press("{ArrowLeft}", () => treeItemById("web"));
      await user.keyboard("{ArrowLeft}");
      await waitFor(() =>
        expect(treeItemById("web")).toHaveAttribute("aria-expanded", "false"),
      );
      await press("{ArrowLeft}", () => treeItemById("prod"));
    });

    it("moves by row, skipping disabled rows, and keeps the column", async () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod"] } });
      treeItemById("db").focus();

      await press("{ArrowUp}", () => treeItemById("web"));
      await press("{ArrowDown}", () => treeItemById("db"));

      await press("{ArrowRight}", () => cell("db", 0));
      await press("{ArrowUp}", () => cell("web", 0));
      await press("{ArrowDown}", () => cell("db", 0));
    });

    it("jumps with Home, End and Ctrl+Home on rows and cells", async () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod"] } });
      treeItemById("web").focus();

      await press("{End}", () => treeItemById("lone"));
      await press("{Home}", () => treeItemById("prod"));

      await user.keyboard("{ArrowRight}");
      await waitFor(() => expect(cell("prod", 0)).toHaveFocus());
      await press("{End}", () => cell("prod", 2));
      await press("{Home}", () => cell("prod", 0));
      await press("{Control>}{End}{/Control}", () => cell("lone", 2));
      await press("{Control>}{Home}{/Control}", () => cell("prod", 0));
    });

    it("moves focus to the next row whose text starts with the typed letters", async () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod"] } });
      treeItemById("prod").focus();

      await press("s", () => treeItemById("stage"));
      // "s" + "a" is one query, "sa", which only Sandbox starts with.
      await press("a", () => treeItemById("lone"));
    });

    it("keeps one tab stop that follows focus", async () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod"] } });
      treeItemById("web").focus();

      await press("{ArrowRight}{ArrowRight}", () => cell("web", 0));
      const stops = document.querySelectorAll('tbody [tabindex="0"]');
      expect(stops).toHaveLength(1);
      expect(stops[0]).toBe(cell("web", 0));
    });
  });

  describe("writing direction", () => {
    it("swaps Left and Right in RTL", async () => {
      const { default: Direction } =
        await import("./TreeViewGridDirection.test.svelte");
      render(Direction);
      treeItemById("analytics").focus();

      await user.keyboard("{ArrowLeft}");
      await waitFor(() =>
        expect(treeItemById("analytics")).toHaveAttribute(
          "aria-expanded",
          "true",
        ),
      );
      await press("{ArrowLeft}", () => cell("analytics", 0));
      await press("{ArrowRight}", () => treeItemById("analytics"));
      await user.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(treeItemById("analytics")).toHaveAttribute(
          "aria-expanded",
          "false",
        ),
      );
    });
  });

  describe("cell controls", () => {
    it("takes controls out of the tab order, and returns them to the cell with Escape", async () => {
      render(TreeViewGrid, {
        props: { widgets: true, expandedIds: ["prod"] },
      });
      const link = within(cell("prod", 2)).getByRole("link");
      const checkbox = within(cell("prod", 2)).getByRole("checkbox");

      expect(link).toHaveAttribute("tabindex", "-1");
      expect(checkbox).toHaveAttribute("tabindex", "-1");

      cell("prod", 2).focus();
      await press("{Enter}", () => link);
      // Tab walks the controls of the cell that holds focus.
      await press("{Tab}", () => checkbox);

      await press("{Escape}", () => cell("prod", 2));
      expect(link).toHaveAttribute("tabindex", "-1");
    });

    it("hands focus to a control with F2 and does not select the row", async () => {
      render(TreeViewGrid, { props: { widgets: true } });
      cell("prod", 2).focus();

      await press("{F2}", () => within(cell("prod", 2)).getByRole("link"));
      expect(selectedOutput()).toHaveTextContent("");
    });

    it("ignores Escape while an IME composition is open", () => {
      render(TreeViewGrid, { props: { widgets: true } });
      const link = within(cell("prod", 2)).getByRole("link");
      link.focus();

      link.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          keyCode: 229,
          bubbles: true,
        }),
      );
      expect(link).toHaveFocus();
    });

    it("leaves keys to a focused control", async () => {
      render(TreeViewGrid, { props: { widgets: true } });
      const checkbox = within(cell("prod", 2)).getByRole("checkbox");
      checkbox.focus();

      await user.keyboard("{ArrowDown}");
      expect(checkbox).toHaveFocus();
    });

    it("does not select the row when a control is clicked", async () => {
      render(TreeViewGrid, { props: { widgets: true } });

      await user.click(within(cell("prod", 2)).getByRole("checkbox"));
      expect(selectedOutput()).toHaveTextContent("");

      await user.click(cell("prod", 1));
      expect(selectedOutput()).toHaveTextContent("prod");
    });

    it("keeps controls in the tab order with widgetNavigation tab", () => {
      render(TreeViewGrid, {
        props: { widgets: true, widgetNavigation: "tab" },
      });

      expect(within(cell("prod", 2)).getByRole("link")).not.toHaveAttribute(
        "tabindex",
      );
    });

    it("removes the tab stop of controls in rows that mount later", async () => {
      render(TreeViewGrid, { props: { widgets: true } });

      await user.click(
        treeItemById("prod").querySelector(".bx--tree-grid__toggle") as Element,
      );
      const link = await within(cell("db", 2)).findByRole("link");
      await waitFor(() => expect(link).toHaveAttribute("tabindex", "-1"));
    });
  });

  describe("expansion", () => {
    it("syncs bind:expandedIds and fires toggle events", async () => {
      const log: Array<{ name: string; detail: unknown }> = [];
      render(TreeViewGrid, { props: { log } });

      await user.click(
        treeItemById("prod").querySelector(".bx--tree-grid__toggle") as Element,
      );
      expect(expandedOutput()).toHaveTextContent("prod");
      expect(log.find((e) => e.name === "toggle")?.detail).toMatchObject({
        id: "prod",
        expanded: true,
        leaf: false,
      });
      await waitFor(() =>
        expect(log.find((e) => e.name === "toggle:change")?.detail).toEqual({
          expandedIds: ["prod"],
          added: ["prod"],
          removed: [],
        }),
      );
    });

    it("shows rows for an expandedIds the parent sets", () => {
      render(TreeViewGrid, { props: { expandedIds: ["stage"] } });

      expect(treeItemById("stage-api")).toBeInTheDocument();
    });

    it("fires toggle for a lazy node so children can load", async () => {
      const log: Array<{ name: string; detail: unknown }> = [];
      render(TreeViewGrid, {
        props: {
          log,
          nodes: [
            {
              id: "lazy",
              text: "Lazy",
              owner: "",
              status: "",
              hasChildren: true,
            },
          ],
        },
      });
      expect(treeItemById("lazy")).toHaveAttribute("aria-expanded", "false");

      treeItemById("lazy").focus();
      await user.keyboard("{ArrowRight}");

      await waitFor(() =>
        expect(log.find((e) => e.name === "toggle")?.detail).toMatchObject({
          id: "lazy",
          expanded: true,
        }),
      );
      expect(treeItemById("lazy")).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("selection", () => {
    it("selects on click and Enter, and reports select and select:change", async () => {
      const log: Array<{ name: string; detail: unknown }> = [];
      render(TreeViewGrid, { props: { log } });

      await user.click(cell("stage", 1));
      expect(treeItemById("stage")).toHaveAttribute("aria-selected", "true");
      expect(treeItemById("prod")).toHaveAttribute("aria-selected", "false");
      expect(selectedOutput()).toHaveTextContent("stage");

      treeItemById("lone").focus();
      await user.keyboard("{Enter}");
      expect(selectedOutput()).toHaveTextContent("lone");
      await waitFor(() =>
        expect(
          log.filter((e) => e.name === "select:change").at(-1)?.detail,
        ).toEqual({
          selectedIds: ["lone"],
          added: ["lone"],
          removed: ["stage"],
        }),
      );
      expect(log.filter((e) => e.name === "select")).toHaveLength(2);
    });

    it("does not select a disabled row", async () => {
      render(TreeViewGrid, { props: { expandedIds: ["prod"] } });

      await user.click(cell("cache", 1));
      expect(selectedOutput()).toHaveTextContent("");
      expect(treeItemById("cache")).not.toHaveAttribute("aria-selected");
      expect(treeItemById("cache")).toHaveAttribute("aria-disabled", "true");
    });

    it("gives the active row the tab stop, and selects a row made active later", async () => {
      const { rerender } = render(TreeViewGrid, {
        props: { activeId: "stage" },
      });

      expect(selectedOutput()).toHaveTextContent("");
      expect(treeItemById("stage")).toHaveAttribute("tabindex", "0");
      expect(treeItemById("stage")).toHaveAttribute("aria-current", "true");

      await rerender({ activeId: "lone" });
      expect(selectedOutput()).toHaveTextContent("lone");
    });

    it("toggles with Ctrl+Click, extends with Shift+Click and selects all with Ctrl+A", async () => {
      render(TreeViewGrid, {
        props: { multiselect: true, expandedIds: ["prod"] },
      });
      expect(screen.getByRole("treegrid")).toHaveAttribute(
        "aria-multiselectable",
        "true",
      );

      await user.click(cell("prod", 1));
      await user.keyboard("{Control>}");
      await user.click(cell("db", 1));
      await user.keyboard("{/Control}");
      expect(selectedOutput()).toHaveTextContent("prod,db");

      await user.click(cell("web", 1));
      await user.keyboard("{Shift>}");
      await user.click(cell("stage", 1));
      await user.keyboard("{/Shift}");
      // The range skips the disabled `cache` row.
      expect(selectedOutput()).toHaveTextContent("web,db,stage");

      treeItemById("web").focus();
      await user.keyboard("{Control>}a{/Control}");
      expect(selectedOutput()).toHaveTextContent("web,db,stage,prod,lone");
    });

    it("toggles the row focus moved to with Shift+Arrow", async () => {
      render(TreeViewGrid, {
        props: { multiselect: true, expandedIds: ["prod"] },
      });
      treeItemById("prod").focus();

      await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
      expect(selectedOutput()).toHaveTextContent("web,db");
    });
  });
});

describe("TreeViewGrid Generics", () => {
  type Resource = {
    id: string;
    text: string;
    cost: number;
    nodes?: Resource[];
  };

  it("types nodes, events and slot nodes from the custom node", () => {
    type Props = ComponentProps<TreeViewGridComponent<Resource>>;
    type Events = ComponentEvents<TreeViewGridComponent<Resource>>;

    expectTypeOf<NonNullable<Props["nodes"]>>().toEqualTypeOf<
      readonly Resource[]
    >();
    expectTypeOf<Events["select"]["detail"]["cost"]>().toEqualTypeOf<number>();
    expectTypeOf<
      Events["toggle"]["detail"]["expanded"]
    >().toEqualTypeOf<boolean>();
    expectTypeOf<
      Events["select:change"]["detail"]["selectedIds"]
    >().toEqualTypeOf<readonly string[]>();
  });
});
