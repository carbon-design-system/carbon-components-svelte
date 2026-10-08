import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboBoxEmpty from "./ComboBoxEmpty.test.svelte";
import ComboBoxEmptySlot from "./ComboBoxEmptySlot.test.svelte";

function emptyRow() {
  return document.querySelector(".bx--list-box__menu-status");
}

describe("ComboBox empty state", () => {
  it("shows a hidden-from-AT row when the filter matches nothing", async () => {
    render(ComboBoxEmpty);

    await user.type(screen.getByRole("combobox"), "zzz");

    const row = emptyRow();
    expect(row).toHaveTextContent("No results");
    expect(row).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("does not show the row while items match", async () => {
    render(ComboBoxEmpty);

    await user.type(screen.getByRole("combobox"), "sl");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(emptyRow()).toBeNull();
  });

  it("builds the message from the typed value", async () => {
    render(ComboBoxEmpty, {
      props: { emptyText: (value: string) => `No match for "${value}"` },
    });

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(emptyRow()).toHaveTextContent('No match for "zzz"');
  });

  it("renders the empty slot in place of the text", async () => {
    render(ComboBoxEmptySlot);

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(emptyRow()).toHaveTextContent('Nothing like "zzz"');
  });

  it('renders no row when `emptyText` is ""', async () => {
    render(ComboBoxEmpty, { props: { emptyText: "" } });

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(emptyRow()).toBeNull();
  });

  it("never highlights the row with the arrow keys", async () => {
    render(ComboBoxEmpty);

    const input = screen.getByRole("combobox");
    await user.type(input, "zzz");
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(input).toHaveAttribute("aria-activedescendant", "");
    expect(emptyRow()).not.toHaveClass("bx--list-box__menu-item--highlighted");
  });
});
