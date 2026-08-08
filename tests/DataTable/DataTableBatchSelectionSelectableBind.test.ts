import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import DataTableBatchSelectionSelectableBind from "./DataTableBatchSelectionSelectableBind.test.svelte";

// Regression test: `batchSelection` used to write `selectable = true` back
// into the exported prop, clobbering a consumer's `bind:selectable`.
describe("DataTable batchSelection does not clobber bound selectable", () => {
  it("keeps a bound selectable false while still rendering selection checkboxes", async () => {
    const { component } = render(DataTableBatchSelectionSelectableBind, {
      props: { selectable: false, batchSelection: true },
    });

    await tick();

    expect(component.selectable).toBe(false);
    expect(
      screen.getByRole("checkbox", { name: "Select all rows" }),
    ).toBeInTheDocument();
  });
});
