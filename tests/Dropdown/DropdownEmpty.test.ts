import { render, screen } from "@testing-library/svelte";
import { createItems } from "../utils/create-items";
import { user } from "../utils/user";
import Dropdown from "./Dropdown.test.svelte";
import DropdownEmptySlot from "./DropdownEmptySlot.test.svelte";

function emptyRow() {
  return document.querySelector(".bx--list-box__menu-status");
}

describe("Dropdown empty state", () => {
  it("shows a hidden-from-AT row when the open menu has no items", async () => {
    render(Dropdown, { props: { labelText: "Contact", items: [] } });

    await user.click(screen.getByRole("combobox"));

    const row = emptyRow();
    expect(row).toHaveTextContent("No options");
    expect(row).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("announces the message through the live region", async () => {
    render(Dropdown, {
      props: { labelText: "Contact", items: [], emptyText: "No methods yet" },
    });

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No methods yet",
    );
  });

  it("does not show the row while there are items", () => {
    render(Dropdown, { props: { items: createItems(2), open: true } });

    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(emptyRow()).toBeNull();
  });

  it("renders the empty slot in place of the text", async () => {
    render(DropdownEmptySlot);

    expect(emptyRow()).toHaveTextContent("Nothing to pick yet");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "No contact methods",
    );
  });

  it('renders no row when `emptyText` is ""', () => {
    render(Dropdown, { props: { items: [], open: true, emptyText: "" } });

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(emptyRow()).toBeNull();
  });

  it("shows the loading row instead while `loading`", async () => {
    const { rerender } = render(Dropdown, {
      props: { items: [], open: true, loading: true },
    });

    expect(await screen.findByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No options")).toBeNull();

    await rerender({ loading: false });

    expect(emptyRow()).toHaveTextContent("No options");
  });

  it("never highlights the row with the arrow keys", async () => {
    render(Dropdown, { props: { labelText: "Contact", items: [] } });

    const button = screen.getByRole("combobox");
    await user.click(button);
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(button).toHaveAttribute("aria-activedescendant", "");
    expect(emptyRow()).not.toHaveClass("bx--list-box__menu-item--highlighted");
  });
});
