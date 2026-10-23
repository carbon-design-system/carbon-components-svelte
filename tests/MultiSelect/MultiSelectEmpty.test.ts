import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectEmpty from "./MultiSelectEmpty.test.svelte";
import MultiSelectEmptyItemsSlot from "./MultiSelectEmptyItemsSlot.test.svelte";
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

describe("MultiSelect empty state (not filterable)", () => {
  it("shows a hidden-from-AT row when the open menu has no items", async () => {
    render(MultiSelectEmpty, { props: { filterable: false, items: [] } });

    await user.click(screen.getByRole("combobox"));

    const row = emptyRow();
    expect(row).toHaveTextContent("No options");
    expect(row).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("announces the message through the live region", async () => {
    render(MultiSelectEmpty, {
      props: { filterable: false, items: [], emptyText: "No methods yet" },
    });

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No methods yet",
    );
  });

  it("does not show the row while there are items", async () => {
    render(MultiSelectEmpty, { props: { filterable: false } });

    await user.click(screen.getByRole("combobox"));

    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(emptyRow()).toBeNull();
  });

  it("shows the row beside a lone select-all item", async () => {
    render(MultiSelectEmpty, {
      props: {
        filterable: false,
        items: [{ id: "all", text: "All", isSelectAll: true }],
      },
    });

    await user.click(screen.getByRole("combobox"));

    expect(emptyRow()).toHaveTextContent("No options");
  });

  it("renders the empty slot in place of the text", async () => {
    render(MultiSelectEmptyItemsSlot);

    expect(emptyRow()).toHaveTextContent("Nothing to pick yet");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "No contact methods",
    );
  });

  it('renders no row when `emptyText` is ""', async () => {
    render(MultiSelectEmpty, {
      props: { filterable: false, items: [], emptyText: "" },
    });

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(emptyRow()).toBeNull();
  });

  it("shows the loading row instead while `loading`", async () => {
    const { rerender } = render(MultiSelectEmpty, {
      props: { filterable: false, items: [], loading: true },
    });

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No options")).toBeNull();

    await rerender({ loading: false });

    expect(emptyRow()).toHaveTextContent("No options");
  });

  it("never highlights the row with the arrow keys", async () => {
    render(MultiSelectEmpty, { props: { filterable: false, items: [] } });

    const field = screen.getByRole("combobox");
    await user.click(field);
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(field).not.toHaveAttribute("aria-activedescendant");
    expect(emptyRow()).toBeInTheDocument();
  });
});
