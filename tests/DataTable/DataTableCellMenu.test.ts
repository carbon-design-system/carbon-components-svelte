import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableCellMenu from "./DataTableCellMenu.test.svelte";

// The table content scrolls, so a cell's Dropdown menu left inside it was
// cut off, and stretched the table's scroll area to fit.
describe("Dropdown in a DataTable cell", () => {
  it("portals the menu out of the table by default", async () => {
    render(DataTableCellMenu);
    await user.click(screen.getByRole("combobox"));
    const menu = screen.getByRole("listbox");
    expect(menu.closest(".bx--data-table-content")).toBeNull();
  });

  it("keeps the menu in the table when portalMenu is false", async () => {
    render(DataTableCellMenu, { props: { portalMenu: false } });
    await user.click(screen.getByRole("combobox"));
    const menu = screen.getByRole("listbox");
    expect(menu.closest(".bx--data-table-content")).not.toBeNull();
  });
});
