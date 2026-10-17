import { render, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableGenerics from "./DataTableGenerics.test.svelte";

describe("DataTable Generics", () => {
  // The fixture's event handlers log the typed row they receive.
  const spyOnLog = () => vi.spyOn(console, "log").mockImplementation(() => {});
  let consoleLog: ReturnType<typeof spyOnLog>;

  beforeEach(() => {
    consoleLog = spyOnLog();
  });

  afterEach(() => {
    consoleLog.mockRestore();
  });

  const getTableRows = (container: HTMLElement, tableIndex = 0) => {
    const tables = container.querySelectorAll("table.bx--data-table");
    const table = tables[tableIndex];
    if (!table) return [];
    const tbody = table.querySelector("tbody");
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll("tr")).filter(
      (row) => !row.classList.contains("bx--expandable-row"),
    );
  };

  const getRowCheckbox = (row: HTMLElement | undefined) => {
    const checkbox = row?.querySelector('input[type="checkbox"]');
    assert(checkbox instanceof HTMLInputElement);
    return checkbox;
  };

  const getExpandButton = (row: HTMLElement | undefined) => {
    const button = row?.querySelector('button[aria-label*="Expand"]');
    assert(button instanceof HTMLButtonElement);
    return button;
  };

  describe("String literal IDs with `as const`", () => {
    it("should properly type selectedRowIds as string literal union", () => {
      const { container } = render(DataTableGenerics);

      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBeGreaterThanOrEqual(1);

      const firstTable = tables[0];
      assert(firstTable instanceof HTMLElement);
      const firstTableContainer = within(firstTable);

      const rows = getTableRows(container, 0);
      expect(rows.length).toBe(3);

      expect(firstTableContainer.getByText("ID")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Name")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Price")).toBeInTheDocument();

      expect(firstTableContainer.getByText("Laptop")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Phone")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Desk")).toBeInTheDocument();
    });

    it("should handle row selection with string literal IDs", async () => {
      const { container } = render(DataTableGenerics);

      const checkbox = getRowCheckbox(getTableRows(container, 0)[0]);
      expect(checkbox.checked).toBe(true); // row-1 is pre-selected

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should emit correctly typed row in click:row--select event", async () => {
      const { container } = render(DataTableGenerics);

      // row-2 ("Phone") is not pre-selected
      await user.click(getRowCheckbox(getTableRows(container, 0)[1]));

      expect(consoleLog).toHaveBeenCalledWith("row-2", "Phone", 599);
    });
  });

  describe("Numeric IDs", () => {
    it("should properly type selectedRowIds as numeric literal union", () => {
      const { container } = render(DataTableGenerics);

      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBeGreaterThanOrEqual(2);

      const secondTable = tables[1];
      assert(secondTable instanceof HTMLElement);
      const secondTableContainer = within(secondTable);

      const rows = getTableRows(container, 1);
      expect(rows.length).toBe(3);

      expect(secondTableContainer.getByText("Item 1")).toBeInTheDocument();
      expect(secondTableContainer.getByText("Item 2")).toBeInTheDocument();
      expect(secondTableContainer.getByText("Item 3")).toBeInTheDocument();
    });

    it("should handle row selection with numeric IDs", () => {
      const { container } = render(DataTableGenerics);

      // Rows 1 and 2 are pre-selected
      const checked = getTableRows(container, 1).map(
        (row) => getRowCheckbox(row).checked,
      );
      expect(checked).toEqual([true, true, false]);
    });

    it("should emit correctly typed row in click:row--select event for numeric IDs", async () => {
      const { container } = render(DataTableGenerics);

      // Item 3 is not pre-selected
      await user.click(getRowCheckbox(getTableRows(container, 1)[2]));

      expect(consoleLog).toHaveBeenCalledWith(3, "Item 3");
    });
  });

  describe("Explicit generic with DataTableRow<string>", () => {
    it("should properly type selectedRowIds and expandedRowIds as string arrays", () => {
      const { container } = render(DataTableGenerics);

      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBeGreaterThanOrEqual(3);

      const thirdTable = tables[2];
      assert(thirdTable instanceof HTMLElement);
      const thirdTableContainer = within(thirdTable);

      const rows = getTableRows(container, 2);
      expect(rows.length).toBe(2);

      expect(thirdTableContainer.getByText("Widget")).toBeInTheDocument();
      expect(thirdTableContainer.getByText("Gadget")).toBeInTheDocument();

      expect(thirdTableContainer.getByText("In Stock")).toBeInTheDocument();
    });

    it("should handle row selection with string IDs", () => {
      const { container } = render(DataTableGenerics);

      // prod-1 is pre-selected
      const checked = getTableRows(container, 2).map(
        (row) => getRowCheckbox(row).checked,
      );
      expect(checked).toEqual([true, false]);
    });

    it("should handle row expansion with string IDs", async () => {
      const { container } = render(DataTableGenerics);

      await user.click(getExpandButton(getTableRows(container, 2)[0]));

      const expandedContent = container.querySelector(
        ".bx--child-row-inner-container",
      );
      expect(expandedContent).toBeInTheDocument();
      expect(expandedContent?.textContent).toContain("Expanded content for");
    });

    it("should emit correctly typed row in click:row event", async () => {
      const { container } = render(DataTableGenerics);

      await user.click(getTableRows(container, 2)[0]);

      expect(consoleLog).toHaveBeenCalledWith("prod-1", "Widget", 10, true);
    });

    it("should emit correctly typed row in click:row--expand event", async () => {
      const { container } = render(DataTableGenerics);

      await user.click(getExpandButton(getTableRows(container, 2)[1]));

      expect(consoleLog).toHaveBeenCalledWith("Expanded:", "prod-2");
    });

    it("should provide correctly typed row to expandedRow slot", async () => {
      const { container } = render(DataTableGenerics);

      await user.click(getExpandButton(getTableRows(container, 2)[0]));

      const expandedContent = container.querySelector(
        ".bx--child-row-inner-container",
      );
      expect(expandedContent).toBeInTheDocument();
      expect(expandedContent).toHaveTextContent("Expanded content for Widget");
    });
  });

  describe("Type safety verification", () => {
    it("should maintain type safety across different row types", () => {
      const { container } = render(DataTableGenerics);

      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBe(4);

      const firstTableRows = getTableRows(container, 0);
      const secondTableRows = getTableRows(container, 1);
      const thirdTableRows = getTableRows(container, 2);

      expect(firstTableRows.length).toBe(3);
      expect(secondTableRows.length).toBe(3);
      expect(thirdTableRows.length).toBe(2);
    });

    it("should not allow mixing ID types between tables", () => {
      // This test verifies compile-time type safety
      // At runtime, we can verify that each table maintains separate state
      const { container } = render(DataTableGenerics);

      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBe(4);

      const firstTable = tables[0];
      const secondTable = tables[1];
      const thirdTable = tables[2];

      expect(firstTable).toBeInTheDocument();
      expect(secondTable).toBeInTheDocument();
      expect(thirdTable).toBeInTheDocument();
    });
  });

  describe("Header empty discriminant", () => {
    it("renders an empty header alongside a non-empty header", () => {
      const { container } = render(DataTableGenerics);

      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBeGreaterThanOrEqual(4);

      const fourthTable = tables[3];
      assert(fourthTable instanceof HTMLElement);
      const headerCells = fourthTable.querySelectorAll("thead th");
      expect(headerCells).toHaveLength(2);
      expect(headerCells[0]?.textContent?.trim()).toBe("Name");
      expect(headerCells[1]?.textContent?.trim()).toBe("");
    });
  });

  describe("Event handler type safety", () => {
    it("should provide correctly typed row in all event handlers", async () => {
      const { container } = render(DataTableGenerics);

      await user.click(getTableRows(container, 2)[1]);

      expect(consoleLog).toHaveBeenCalledWith("prod-2", "Gadget", 20, false);
    });
  });
});
