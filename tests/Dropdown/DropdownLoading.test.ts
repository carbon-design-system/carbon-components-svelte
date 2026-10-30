import { render, screen } from "@testing-library/svelte";
import { createItems } from "../utils/create-items";
import { user } from "../utils/user";
import Dropdown from "./Dropdown.test.svelte";

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

describe("Dropdown loadingDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getRow() {
    return document.querySelector(".bx--list-box__menu-status");
  }

  it("shows the loading row after the delay and holds it for the minimum", async () => {
    const { rerender } = render(Dropdown, {
      props: { items: createItems(2), open: true, loadingDelay: 300 },
    });
    await rerender({ loading: true });

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(getRow()).toBeNull();

    await vi.advanceTimersByTimeAsync(300);
    expect(getRow()).toHaveTextContent("Loading...");

    await vi.advanceTimersByTimeAsync(100);
    await rerender({ loading: false });
    expect(screen.getByRole("listbox")).not.toHaveAttribute("aria-busy");
    expect(getRow()).not.toBeNull();

    // Shown at 300 ms, so the 500 ms minimum ends at 800 ms.
    await vi.advanceTimersByTimeAsync(399);
    expect(getRow()).not.toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(getRow()).toBeNull();
  });

  it("never shows the row for loading that ends within the delay", async () => {
    const { rerender } = render(Dropdown, {
      props: { items: createItems(2), open: true, loadingDelay: 300 },
    });
    await rerender({ loading: true });
    await vi.advanceTimersByTimeAsync(150);
    await rerender({ loading: false });
    await vi.advanceTimersByTimeAsync(1000);

    expect(getRow()).toBeNull();
  });
});
