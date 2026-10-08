import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Dropdown from "./Dropdown.test.svelte";
import { createItems } from "./helpers";

describe("Dropdown loading state", () => {
  it("renders a loading row after the options and marks the menu busy", async () => {
    render(Dropdown, {
      props: { items: createItems(2), open: true, loading: true },
    });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-busy", "true");
    const row = document.querySelector(".bx--list-box__menu-status");
    expect(row).toHaveAttribute("aria-hidden", "true");
    expect(listbox.lastElementChild).toBe(row);
    expect(await screen.findByText("Loading...")).toBeInTheDocument();
  });

  it("uses `loadingText` and drops the row once loading ends", async () => {
    const { rerender } = render(Dropdown, {
      props: {
        items: createItems(2),
        open: true,
        loading: true,
        loadingText: "Fetching",
      },
    });
    expect(await screen.findByText("Fetching")).toBeInTheDocument();

    await rerender({ loading: false });

    expect(screen.getByRole("listbox")).not.toHaveAttribute("aria-busy");
    expect(document.querySelector(".bx--list-box__menu-status")).toBeNull();
  });

  it("keeps the options selectable while loading", async () => {
    const onselect = vi.fn();
    render(Dropdown, {
      props: { items: createItems(2), loading: true, onselect },
    });

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Item 2" }));

    expect(onselect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("combobox")).toHaveTextContent("Item 2");
  });
});
