import { fireEvent, render, screen } from "@testing-library/svelte";
import { setMenuMetrics } from "../utils/set-menu-metrics";
import SearchMenuScrollend from "./SearchMenuScrollend.test.svelte";

function createItems(count: number) {
  return Array.from({ length: count }, (_, i) => `Item ${i + 1}`);
}

const nearBottom = { scrollTop: 800, scrollHeight: 1000, clientHeight: 200 };

describe("SearchMenu scrollend", () => {
  it("dispatches scrollend when the results menu is scrolled near the bottom", async () => {
    const onScrollend = vi.fn();
    render(SearchMenuScrollend, {
      props: { items: createItems(40), onScrollend },
    });

    await fireEvent.focus(screen.getByRole("combobox"));
    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, nearBottom);
    await fireEvent.scroll(menu);

    expect(onScrollend).toHaveBeenCalledTimes(1);
    expect(onScrollend.mock.calls[0][0].detail).toEqual(nearBottom);
  });

  it("does not dispatch scrollend for a non-overflowing list", async () => {
    const onScrollend = vi.fn();
    render(SearchMenuScrollend, {
      props: { items: createItems(3), onScrollend },
    });

    await fireEvent.focus(screen.getByRole("combobox"));
    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, {
      scrollTop: 0,
      scrollHeight: 100,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);

    expect(onScrollend).not.toHaveBeenCalled();
  });

  it("re-arms when the slotted item count grows", async () => {
    const onScrollend = vi.fn();
    const { rerender } = render(SearchMenuScrollend, {
      props: { items: createItems(20), onScrollend },
    });

    await fireEvent.focus(screen.getByRole("combobox"));
    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, nearBottom);
    await fireEvent.scroll(menu);
    await fireEvent.scroll(menu);
    expect(onScrollend).toHaveBeenCalledTimes(1);

    await rerender({ items: createItems(40), onScrollend });

    const menuAfter = screen.getByRole("listbox");
    setMenuMetrics(menuAfter, {
      scrollTop: 1400,
      scrollHeight: 1600,
      clientHeight: 200,
    });
    await fireEvent.scroll(menuAfter);
    expect(onScrollend).toHaveBeenCalledTimes(2);
  });
});
