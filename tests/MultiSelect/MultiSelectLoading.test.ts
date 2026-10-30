import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectEmpty from "./MultiSelectEmpty.test.svelte";

describe("MultiSelect loading state", () => {
  it("renders a loading row and marks the menu busy", async () => {
    render(MultiSelectEmpty, { props: { filterable: false, loading: true } });

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByText("Loading...")).toBeInTheDocument();
  });

  it("hides the empty state while loading", async () => {
    render(MultiSelectEmpty, { props: { loading: true } });

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(await screen.findByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("keeps the options selectable while loading", async () => {
    render(MultiSelectEmpty, { props: { filterable: false, loading: true } });

    await user.click(screen.getByRole("combobox"));
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    expect(option).toHaveAttribute("aria-selected", "true");
  });
});

describe("MultiSelect loadingDelay", () => {
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
    const { rerender } = render(MultiSelectEmpty, {
      props: { filterable: false, open: true, loadingDelay: 300 },
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
    const { rerender } = render(MultiSelectEmpty, {
      props: { filterable: false, open: true, loadingDelay: 300 },
    });
    await rerender({ loading: true });
    await vi.advanceTimersByTimeAsync(150);
    await rerender({ loading: false });
    await vi.advanceTimersByTimeAsync(1000);

    expect(getRow()).toBeNull();
  });
});
