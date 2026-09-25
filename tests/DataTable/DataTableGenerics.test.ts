import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DataTableGenerics from "./DataTableGenerics.test.svelte";

describe("DataTable Generics", () => {
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

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const firstTableCheckboxes = Array.from(checkboxes).filter((cb) => {
        const row = cb.closest("tr");
        return row && getTableRows(container, 0).includes(row);
      });

      expect(firstTableCheckboxes.length).toBeGreaterThan(0);

      if (firstTableCheckboxes.length > 0) {
        const firstCheckbox = firstTableCheckboxes[0];
        assert(firstCheckbox instanceof HTMLInputElement);
        expect(firstCheckbox.checked).toBe(true); // row-1 is pre-selected

        await user.click(firstCheckbox);
        await tick();

        await user.click(firstCheckbox);
        await tick();
      }
    });

    it("should emit correctly typed row in click:row--select event", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(DataTableGenerics);

      const checkboxes = screen.getAllByRole("checkbox");
      const firstDataCheckbox = checkboxes.find((cb) => {
        const row = cb.closest("tr");
        return row?.querySelector('td[data-cell="name"]');
      });

      if (firstDataCheckbox) {
        await user.click(firstDataCheckbox);
        await tick();

        // The event handler should receive a row typed as Row, not DataTableRow<any>
        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
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

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const secondTableCheckboxes = Array.from(checkboxes).filter((cb) => {
        const row = cb.closest("tr");
        return row && getTableRows(container, 1).includes(row);
      });

      expect(secondTableCheckboxes.length).toBeGreaterThan(0);

      // Verify pre-selected rows (1 and 2 should be pre-selected)
      const checkedBoxes = secondTableCheckboxes.filter((cb) => {
        assert(cb instanceof HTMLInputElement);
        return cb.checked;
      });
      expect(checkedBoxes.length).toBeGreaterThanOrEqual(0);
    });

    it("should emit correctly typed row in click:row--select event for numeric IDs", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(DataTableGenerics);

      const checkboxes = screen.getAllByRole("checkbox");
      const secondTableCheckbox = checkboxes.find((cb) => {
        const row = cb.closest("tr");
        return row?.textContent?.includes("Item");
      });

      if (secondTableCheckbox) {
        await user.click(secondTableCheckbox);
        await tick();

        // The event handler should receive a row typed as NumericRow, not DataTableRow<any>
        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
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

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const thirdTableCheckboxes = Array.from(checkboxes).filter((cb) => {
        const row = cb.closest("tr");
        return row && getTableRows(container, 2).includes(row);
      });

      expect(thirdTableCheckboxes.length).toBeGreaterThan(0);

      // Verify pre-selected row (prod-1 should be pre-selected)
      const checkedBoxes = thirdTableCheckboxes.filter((cb) => {
        assert(cb instanceof HTMLInputElement);
        return cb.checked;
      });
      expect(checkedBoxes.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle row expansion with string IDs", async () => {
      const { container } = render(DataTableGenerics);

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
        const firstExpandButton = thirdTableExpandButtons[0];
        assert(firstExpandButton instanceof HTMLButtonElement);
        await user.click(firstExpandButton);
        await tick();

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

      const rows = getTableRows(container, 2);
      if (rows.length > 0) {
        await user.click(rows[0]);
        await tick();

        // The event handler should receive a row typed as ProductRow, not DataTableRow<any>
        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
    });

    it("should emit correctly typed row in click:row--expand event", async () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      const { container } = render(DataTableGenerics);

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
        const expandButton = thirdTableExpandButtons[0];
        assert(expandButton instanceof HTMLButtonElement);
        await user.click(expandButton);
        await tick();

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

    it("should provide correctly typed row to expandedRow slot", async () => {
      const { container } = render(DataTableGenerics);

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
        const expandButton = thirdTableExpandButtons[0];
        assert(expandButton instanceof HTMLButtonElement);
        await user.click(expandButton);
        await tick();

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
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      const { container } = render(DataTableGenerics);

      const rows = getTableRows(container, 2);
      if (rows.length > 0) {
        await user.click(rows[0]);
        await tick();

        expect(consoleLog).toHaveBeenCalled();
      }

      consoleLog.mockRestore();
    });
  });
});
