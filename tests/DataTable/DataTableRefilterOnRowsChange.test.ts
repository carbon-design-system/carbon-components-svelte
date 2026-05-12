import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import DataTableRefilterOnRowsChange from "./DataTableRefilterOnRowsChange.test.svelte";

describe("DataTable re-filters when rows change", () => {
  // Skip the header row.
  const getTableRows = () => screen.getAllByRole("row").slice(1);

  it("preserves an active filter when the rows prop is reassigned", async () => {
    render(DataTableRefilterOnRowsChange);

    // Initial filter ("round") was applied on mount via the context's
    // filterRows. Five of the ten initial rows match "Round robin".
    let tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("Round robin");
    }

    // Reassign `rows` to a new set. The filter ("round") should still apply
    // and only match rows containing "Round!" — two of the four new rows.
    await user.click(screen.getByRole("button", { name: "Toggle rows" }));

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(2);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("Round!");
    }
  });
});
