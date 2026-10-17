import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableGenerics from "./DataTableGenerics.test.svelte";

describe("DataTable Generics", () => {
  const getTableBodyRows = (container: HTMLElement, tableIndex = 0) => {
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
    it("should handle row selection with string literal IDs", async () => {
      const { container } = render(DataTableGenerics);

      const checkbox = getRowCheckbox(getTableBodyRows(container, 0)[0]);
      expect(checkbox.checked).toBe(true); // row-1 is pre-selected

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should emit correctly typed row in click:row--select event", async () => {
      const onRowSelect = vi.fn();
      const { container } = render(DataTableGenerics, {
        props: { onRowSelect },
      });

      // row-2 ("Phone") is not pre-selected
      await user.click(getRowCheckbox(getTableBodyRows(container, 0)[1]));

      expect(onRowSelect).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: "row-2", name: "Phone", price: 599 }),
      );
    });
  });

  describe("Numeric IDs", () => {
    it("should handle row selection with numeric IDs", () => {
      const { container } = render(DataTableGenerics);

      // Rows 1 and 2 are pre-selected
      const checked = getTableBodyRows(container, 1).map(
        (row) => getRowCheckbox(row).checked,
      );
      expect(checked).toEqual([true, true, false]);
    });

    it("should emit correctly typed row in click:row--select event for numeric IDs", async () => {
      const onNumericRowSelect = vi.fn();
      const { container } = render(DataTableGenerics, {
        props: { onNumericRowSelect },
      });

      // Item 3 is not pre-selected
      await user.click(getRowCheckbox(getTableBodyRows(container, 1)[2]));

      expect(onNumericRowSelect).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 3, name: "Item 3" }),
      );
    });
  });

  describe("Explicit generic with DataTableRow<string>", () => {
    it("should handle row selection with string IDs", () => {
      const { container } = render(DataTableGenerics);

      // prod-1 is pre-selected
      const checked = getTableBodyRows(container, 2).map(
        (row) => getRowCheckbox(row).checked,
      );
      expect(checked).toEqual([true, false]);
    });

    it("should emit correctly typed row in click:row event", async () => {
      const onProductRowClick = vi.fn();
      const { container } = render(DataTableGenerics, {
        props: { onProductRowClick },
      });

      await user.click(getTableBodyRows(container, 2)[0]);

      expect(onProductRowClick).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          id: "prod-1",
          name: "Widget",
          price: 10,
          inStock: true,
        }),
      );
    });

    it("should emit correctly typed row in click:row--expand event", async () => {
      const onProductRowExpand = vi.fn();
      const { container } = render(DataTableGenerics, {
        props: { onProductRowExpand },
      });

      await user.click(getExpandButton(getTableBodyRows(container, 2)[1]));

      expect(onProductRowExpand).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: "prod-2" }),
      );
    });

    it("should provide correctly typed row to expandedRow slot", async () => {
      const { container } = render(DataTableGenerics);

      await user.click(getExpandButton(getTableBodyRows(container, 2)[0]));

      const expandedContent = container.querySelector(
        ".bx--child-row-inner-container",
      );
      expect(expandedContent).toBeInTheDocument();
      expect(expandedContent).toHaveTextContent("Expanded content for Widget");
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
});
