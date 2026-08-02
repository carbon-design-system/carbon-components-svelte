import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ComboBoxScrollend from "./ComboBoxScrollend.test.svelte";

function createItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    text: `Item ${i + 1}`,
  }));
}

function setMenuMetrics(
  menu: HTMLElement,
  {
    scrollTop,
    scrollHeight,
    clientHeight,
  }: { scrollTop: number; scrollHeight: number; clientHeight: number },
) {
  Object.defineProperty(menu, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(menu, "clientHeight", {
    value: clientHeight,
    configurable: true,
  });
  menu.scrollTop = scrollTop;
}

describe("ComboBox scrollend", () => {
  it("dispatches scrollend when scrolled near the bottom", async () => {
    const onScrollend = vi.fn();
    render(ComboBoxScrollend, {
      props: {
        items: createItems(40),
        open: true,
        onScrollend,
      },
    });

    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, {
      scrollTop: 800,
      scrollHeight: 1000,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);

    expect(onScrollend).toHaveBeenCalledTimes(1);
    expect(onScrollend.mock.calls[0][0].detail).toEqual({
      scrollTop: 800,
      scrollHeight: 1000,
      clientHeight: 200,
    });
  });

  it("does not dispatch scrollend on open or for non-overflowing lists", async () => {
    const onScrollend = vi.fn();
    render(ComboBoxScrollend, {
      props: {
        items: createItems(3),
        open: true,
        onScrollend,
      },
    });

    await tick();
    expect(onScrollend).not.toHaveBeenCalled();

    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, {
      scrollTop: 0,
      scrollHeight: 100,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);

    expect(onScrollend).not.toHaveBeenCalled();
  });

  it("does not spam while held at the bottom; re-arms after scroll-away", async () => {
    const onScrollend = vi.fn();
    render(ComboBoxScrollend, {
      props: {
        items: createItems(40),
        open: true,
        onScrollend,
      },
    });

    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, {
      scrollTop: 800,
      scrollHeight: 1000,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);
    await fireEvent.scroll(menu);
    expect(onScrollend).toHaveBeenCalledTimes(1);

    setMenuMetrics(menu, {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);

    setMenuMetrics(menu, {
      scrollTop: 800,
      scrollHeight: 1000,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);
    expect(onScrollend).toHaveBeenCalledTimes(2);
  });

  it("re-arms when items grow", async () => {
    const onScrollend = vi.fn();
    const { rerender } = render(ComboBoxScrollend, {
      props: {
        items: createItems(20),
        open: true,
        onScrollend,
      },
    });

    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, {
      scrollTop: 800,
      scrollHeight: 1000,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);
    expect(onScrollend).toHaveBeenCalledTimes(1);

    const spacerBefore = menu.querySelector<HTMLElement>(":scope > div");
    const heightBefore = spacerBefore?.style.height;

    await rerender({
      items: createItems(40),
      open: true,
      onScrollend,
      virtualize: { containerHeight: 200, threshold: 1 },
      shouldFilterItem: () => true,
    });
    await tick();

    const menuAfter = screen.getByRole("listbox");
    const spacerAfter = menuAfter.querySelector<HTMLElement>(":scope > div");
    // 40 items * 40px default itemHeight
    expect(spacerAfter?.style.height).toBe("1600px");
    expect(heightBefore).toBe("800px");

    setMenuMetrics(menuAfter, {
      scrollTop: 1400,
      scrollHeight: 1600,
      clientHeight: 200,
    });
    await fireEvent.scroll(menuAfter);
    expect(onScrollend).toHaveBeenCalledTimes(2);
  });

  it("still forwards the raw DOM scroll event", async () => {
    const onScroll = vi.fn();
    render(ComboBoxScrollend, {
      props: {
        items: createItems(40),
        open: true,
        onScroll,
      },
    });

    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, {
      scrollTop: 100,
      scrollHeight: 1000,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);

    expect(onScroll).toHaveBeenCalled();
  });

  it("works when opened via user interaction", async () => {
    const onScrollend = vi.fn();
    render(ComboBoxScrollend, {
      props: {
        items: createItems(40),
        onScrollend,
      },
    });

    await user.click(screen.getByRole("combobox"));
    const menu = screen.getByRole("listbox");
    setMenuMetrics(menu, {
      scrollTop: 800,
      scrollHeight: 1000,
      clientHeight: 200,
    });
    await fireEvent.scroll(menu);

    expect(onScrollend).toHaveBeenCalledTimes(1);
  });
});
