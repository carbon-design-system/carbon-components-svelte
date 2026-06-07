import { render } from "@testing-library/svelte";
import DataTableExpandableDuplicateIds from "./DataTableExpandableDuplicateIds.test.svelte";

describe("DataTableExpandableDuplicateIds", () => {
  test("scopes expandable-row ids per instance so they stay globally unique", () => {
    const { container } = render(DataTableExpandableDuplicateIds);

    const expandableRows = container.querySelectorAll<HTMLTableRowElement>(
      "tr[data-child-row][id]",
    );
    // 2 rows * 2 tables
    expect(expandableRows).toHaveLength(4);

    const ids = Array.from(expandableRows, (row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("each per-row expand button's aria-controls resolves within the same table instance", () => {
    const { container } = render(DataTableExpandableDuplicateIds);

    const tables = container.querySelectorAll("table");
    expect(tables).toHaveLength(2);

    for (const table of tables) {
      const expandButtons = table.querySelectorAll<HTMLButtonElement>(
        "tbody button[aria-controls]",
      );
      expect(expandButtons.length).toBeGreaterThan(0);

      for (const button of expandButtons) {
        const controls = button.getAttribute("aria-controls") ?? "";
        expect(controls).toBeTruthy();

        // The controlled expandable row must exist within the same table.
        const controlledRow = table.querySelector(
          `tr[data-child-row]#${CSS.escape(controls)}`,
        );
        expect(controlledRow).toBeInTheDocument();
      }
    }
  });
});
