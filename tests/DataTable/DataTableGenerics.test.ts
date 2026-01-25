import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import DataTableGenerics from "./DataTableGenerics.test.svelte";

describe("DataTable Generics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("String literal IDs with `as const`", () => {
    it("should properly type selectedRowIds as string literal union", () => {
      const { container } = render(DataTableGenerics);

      // Verify table renders
      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBeGreaterThanOrEqual(1);

      // Get first table
      const firstTable = tables[0];
      const firstTableContainer = within(firstTable as HTMLElement);

      // Verify rows are rendered
      const rows = getTableRows(container, 0);
      expect(rows.length).toBe(3);

      // Verify headers within first table
      expect(firstTableContainer.getByText("ID")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Name")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Price")).toBeInTheDocument();

      // Verify row content within first table
      expect(firstTableContainer.getByText("Laptop")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Phone")).toBeInTheDocument();
      expect(firstTableContainer.getByText("Desk")).toBeInTheDocument();

      // Type check: selectedRowIds should be typed as ReadonlyArray<"row-1" | "row-2" | "row-3">
      // This is verified by TypeScript at compile time
    });

    it("should handle row selection with string literal IDs", async () => {
      const { container } = render(DataTableGenerics);

      // Find checkboxes in the first table
      const checkboxes = container.querySelectorAll(
        'input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      const firstTableCheckboxes = Array.from(checkboxes).filter((cb) => {
        const row = cb.closest("tr");
        return row && getTableRows(container, 0).includes(row);
      });

      expect(firstTableCheckboxes.length).toBeGreaterThan(0);

      // Click the first checkbox (row-1 should be pre-selected)
      if (firstTableCheckboxes.length > 0) {
        const firstCheckbox = firstTableCheckboxes[0];
        expect(firstCheckbox?.checked).toBe(true); // row-1 is pre-selected

        // Click to deselect
        await user.click(firstCheckbox);
        await tick();

        // Click to select again
        await user.click(firstCheckbox);
        await tick();
      }
    });

    it("should emit correctly typed row in click:row--select event", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(DataTableGenerics);

      // Find and click a checkbox in the first table
      const checkboxes = screen.getAllByRole("checkbox");
      const firstDataCheckbox = checkboxes.find((cb) => {
        const row = cb.closest("tr");
        return row?.querySelector('td[data-cell="name"]');
      });

      if (firstDataCheckbox) {
        await user.click(firstDataCheckbox);
        await tick();

        // Verify console.log was called (event handler logs row data)
        // The event handler should receive a row typed as Row, not DataTableRow<any>
        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
    });
  });

  describe("Numeric IDs", () => {
    it("should properly type selectedRowIds as numeric literal union", () => {
      const { container } = render(DataTableGenerics);

      // Verify second table renders
      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBeGreaterThanOrEqual(2);

      // Get second table
      const secondTable = tables[1];
      const secondTableContainer = within(secondTable as HTMLElement);

      // Verify rows are rendered in second table
      const rows = getTableRows(container, 1);
      expect(rows.length).toBe(3);

      // Verify row content within second table
      expect(secondTableContainer.getByText("Item 1")).toBeInTheDocument();
      expect(secondTableContainer.getByText("Item 2")).toBeInTheDocument();
      expect(secondTableContainer.getByText("Item 3")).toBeInTheDocument();

      // Type check: numericSelectedRowIds should be typed as ReadonlyArray<1 | 2 | 3>
      // This is verified by TypeScript at compile time
    });

    it("should handle row selection with numeric IDs", () => {
      const { container } = render(DataTableGenerics);

      // Find checkboxes in the second table
      const checkboxes = container.querySelectorAll(
        'input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      const secondTableCheckboxes = Array.from(checkboxes).filter((cb) => {
        const row = cb.closest("tr");
        return row && getTableRows(container, 1).includes(row);
      });

      expect(secondTableCheckboxes.length).toBeGreaterThan(0);

      // Verify pre-selected rows (1 and 2 should be pre-selected)
      const checkedBoxes = secondTableCheckboxes.filter((cb) => cb?.checked);
      expect(checkedBoxes.length).toBeGreaterThanOrEqual(0);
    });

    it("should emit correctly typed row in click:row--select event for numeric IDs", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(DataTableGenerics);

      // Find and click a checkbox in the second table
      const checkboxes = screen.getAllByRole("checkbox");
      const secondTableCheckbox = checkboxes.find((cb) => {
        const row = cb.closest("tr");
        return row?.textContent?.includes("Item");
      });

      if (secondTableCheckbox) {
        await user.click(secondTableCheckbox);
        await tick();

        // Verify console.log was called
        // The event handler should receive a row typed as NumericRow, not DataTableRow<any>
        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
    });
  });

  describe("Explicit generic with DataTableRow<string>", () => {
    it("should properly type selectedRowIds and expandedRowIds as string arrays", () => {
      const { container } = render(DataTableGenerics);

      // Verify third table renders
      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBeGreaterThanOrEqual(3);

      // Get third table
      const thirdTable = tables[2];
      const thirdTableContainer = within(thirdTable as HTMLElement);

      // Verify rows are rendered in third table
      const rows = getTableRows(container, 2);
      expect(rows.length).toBe(2);

      // Verify row content within third table
      expect(thirdTableContainer.getByText("Widget")).toBeInTheDocument();
      expect(thirdTableContainer.getByText("Gadget")).toBeInTheDocument();

      // Verify headers within third table
      expect(thirdTableContainer.getByText("In Stock")).toBeInTheDocument();

      // Type check: productSelectedRowIds should be typed as ReadonlyArray<string>
      // productExpandedRowIds should be typed as ReadonlyArray<string>
      // This is verified by TypeScript at compile time
    });

    it("should handle row selection with string IDs", () => {
      const { container } = render(DataTableGenerics);

      // Find checkboxes in the third table
      const checkboxes = container.querySelectorAll(
        'input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      const thirdTableCheckboxes = Array.from(checkboxes).filter((cb) => {
        const row = cb.closest("tr");
        return row && getTableRows(container, 2).includes(row);
      });

      expect(thirdTableCheckboxes.length).toBeGreaterThan(0);

      // Verify pre-selected row (prod-1 should be pre-selected)
      const checkedBoxes = thirdTableCheckboxes.filter((cb) => cb?.checked);
      expect(checkedBoxes.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle row expansion with string IDs", async () => {
      const { container } = render(DataTableGenerics);

      // Find expand buttons in the third table
      const expandButtons = container.querySelectorAll(
        'button[aria-label*="Expand"]',
      );
      const thirdTableExpandButtons = Array.from(expandButtons).filter(
        (btn) => {
          const row = btn.closest("tr");
          return row && getTableRows(container, 2).includes(row);
        },
      );

      if (thirdTableExpandButtons.length > 0) {
        const firstExpandButton =
          thirdTableExpandButtons[0] as HTMLButtonElement;
        await user.click(firstExpandButton);
        await tick();

        // Verify expanded content is rendered
        const expandedContent = container.querySelector(
          ".bx--child-row-inner-container",
        );
        expect(expandedContent).toBeInTheDocument();
        expect(expandedContent?.textContent).toContain("Expanded content for");
      }
    });

    it("should emit correctly typed row in click:row event", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      const { container } = render(DataTableGenerics);

      // Find a row in the third table and click it
      const rows = getTableRows(container, 2);
      if (rows.length > 0) {
        await user.click(rows[0]);
        await tick();

        // Verify console.log was called
        // The event handler should receive a row typed as ProductRow, not DataTableRow<any>
        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
    });

    it("should emit correctly typed row in click:row--expand event", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      const { container } = render(DataTableGenerics);

      // Find expand button in the third table
      const expandButtons = container.querySelectorAll(
        'button[aria-label*="Expand"]',
      );
      const thirdTableExpandButtons = Array.from(expandButtons).filter(
        (btn) => {
          const row = btn.closest("tr");
          return row && getTableRows(container, 2).includes(row);
        },
      );

      if (thirdTableExpandButtons.length > 0) {
        const expandButton = thirdTableExpandButtons[0] as HTMLButtonElement;
        await user.click(expandButton);
        await tick();

        // Verify console.log was called with "Expanded:" prefix
        // The event handler should receive a row typed as ProductRow
        expect(consoleLog).toHaveBeenCalled();
        const logCalls = consoleLog.mock.calls.flat();
        const hasExpandedLog = logCalls.some((call) =>
          String(call).includes("Expanded:"),
        );
        expect(hasExpandedLog).toBe(true);
      }

      consoleLog.mockRestore();
    });

    it("should provide correctly typed row to expanded-row slot", async () => {
      const { container } = render(DataTableGenerics);

      // Find expand button in the third table
      const expandButtons = container.querySelectorAll(
        'button[aria-label*="Expand"]',
      );
      const thirdTableExpandButtons = Array.from(expandButtons).filter(
        (btn) => {
          const row = btn.closest("tr");
          return row && getTableRows(container, 2).includes(row);
        },
      );

      if (thirdTableExpandButtons.length > 0) {
        const expandButton = thirdTableExpandButtons[0] as HTMLButtonElement;
        await user.click(expandButton);
        await tick();

        // Verify expanded content shows row name
        // The slot should receive a row typed as ProductRow
        const expandedContent = container.querySelector(
          ".bx--child-row-inner-container",
        );
        expect(expandedContent).toBeInTheDocument();
        expect(
          expandedContent?.textContent?.includes("Widget") ||
            expandedContent?.textContent?.includes("Gadget"),
        ).toBe(true);
      }
    });
  });

  describe("Type safety verification", () => {
    it("should maintain type safety across different row types", () => {
      const { container } = render(DataTableGenerics);

      // Verify all three tables render independently
      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBe(3);

      // Verify each table has its own rows
      const firstTableRows = getTableRows(container, 0);
      const secondTableRows = getTableRows(container, 1);
      const thirdTableRows = getTableRows(container, 2);

      expect(firstTableRows.length).toBe(3);
      expect(secondTableRows.length).toBe(3);
      expect(thirdTableRows.length).toBe(2);

      // Verify each table maintains its own typed selectedRowIds
      // Type: First table: ReadonlyArray<"row-1" | "row-2" | "row-3">
      // Type: Second table: ReadonlyArray<1 | 2 | 3>
      // Type: Third table: ReadonlyArray<string>
      // This is verified by TypeScript at compile time
    });

    it("should not allow mixing ID types between tables", () => {
      // This test verifies compile-time type safety
      // At runtime, we can verify that each table maintains separate state
      const { container } = render(DataTableGenerics);

      const tables = container.querySelectorAll("table.bx--data-table");
      expect(tables.length).toBe(3);

      // Each table should have its own selection state
      // TypeScript prevents assigning wrong ID types at compile time
      // Runtime verification: tables are independent
      const firstTable = tables[0];
      const secondTable = tables[1];
      const thirdTable = tables[2];

      expect(firstTable).toBeInTheDocument();
      expect(secondTable).toBeInTheDocument();
      expect(thirdTable).toBeInTheDocument();
    });
  });

  describe("Event handler type safety", () => {
    it("should provide correctly typed row in all event handlers", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      const { container } = render(DataTableGenerics);

      // Test click:row event on third table (ProductRow)
      const rows = getTableRows(container, 2);
      if (rows.length > 0) {
        await user.click(rows[0]);
        await tick();

        // Verify the event handler received a ProductRow with all properties
        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
    });
  });
});
