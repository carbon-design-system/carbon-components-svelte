import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectEmpty from "./MultiSelectEmpty.test.svelte";
import MultiSelectEmptySlot from "./MultiSelectEmptySlot.test.svelte";

function emptyRow() {
  return document.querySelector(".bx--list-box__menu-status");
}

describe("MultiSelect empty state", () => {
  it("shows a hidden-from-AT row when the filter matches nothing", async () => {
    render(MultiSelectEmpty);

    await user.type(screen.getByRole("combobox"), "zzz");

    const row = emptyRow();
    expect(row).toHaveTextContent("No results");
    expect(row).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("builds the message from the filter text", async () => {
    render(MultiSelectEmpty, {
      props: { emptyText: (value: string) => `No match for "${value}"` },
    });

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(emptyRow()).toHaveTextContent('No match for "zzz"');
  });

  it("renders the empty slot in place of the text", async () => {
    render(MultiSelectEmptySlot);

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(emptyRow()).toHaveTextContent('Nothing like "zzz"');
  });

  it('renders no row when `emptyText` is ""', async () => {
    render(MultiSelectEmpty, { props: { emptyText: "" } });

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(emptyRow()).toBeNull();
  });

  it("never highlights the row with the arrow keys", async () => {
    render(MultiSelectEmpty);

    const input = screen.getByRole("combobox");
    await user.type(input, "zzz");
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(input).not.toHaveAttribute("aria-activedescendant");
    expect(emptyRow()).toBeInTheDocument();
  });
});
