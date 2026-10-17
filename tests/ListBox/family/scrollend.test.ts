import { fireEvent, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { createItems } from "../../utils/create-items";
import { setMenuMetrics } from "../../utils/set-menu-metrics";
import { user } from "../../utils/user";
import { caseRows, field, renderCase } from "./cases";

const nearBottom = { scrollTop: 800, scrollHeight: 1000, clientHeight: 200 };
const atTop = { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 };

function menu() {
  return screen.getByRole("listbox");
}

async function scrollMenu(metrics: Parameters<typeof setMenuMetrics>[1]) {
  setMenuMetrics(menu(), metrics);
  await fireEvent.scroll(menu());
}

describe.each(caseRows)("%s scrollend", (_, c) => {
  const fields = (count: number) => ({
    items: createItems(count),
    virtualize: { containerHeight: 200, threshold: 1 },
    portalMenu: false,
  });

  const setup = (count: number, open = true) => {
    const onScrollend = vi.fn();
    const onScroll = vi.fn();
    const result = renderCase(c, fields(count), {
      open,
      onScrollend,
      onScroll,
    });
    return { ...result, onScrollend, onScroll };
  };

  it("dispatches scrollend when scrolled near the bottom", async () => {
    const { onScrollend } = setup(40);

    await scrollMenu(nearBottom);

    expect(onScrollend).toHaveBeenCalledTimes(1);
    expect(onScrollend.mock.calls[0][0].detail).toEqual(nearBottom);
  });

  it("does not dispatch scrollend on open or for non-overflowing lists", async () => {
    const { onScrollend } = setup(3);

    await tick();
    expect(onScrollend).not.toHaveBeenCalled();

    await scrollMenu({ scrollTop: 0, scrollHeight: 100, clientHeight: 200 });

    expect(onScrollend).not.toHaveBeenCalled();
  });

  it("does not spam while held at the bottom; re-arms after scroll-away", async () => {
    const { onScrollend } = setup(40);

    await scrollMenu(nearBottom);
    await fireEvent.scroll(menu());
    expect(onScrollend).toHaveBeenCalledTimes(1);

    await scrollMenu(atTop);
    await scrollMenu(nearBottom);
    expect(onScrollend).toHaveBeenCalledTimes(2);
  });

  it("re-arms when items grow", async () => {
    const { onScrollend, rerenderField } = setup(20);

    await scrollMenu(nearBottom);
    expect(onScrollend).toHaveBeenCalledTimes(1);
    const spacer = () => menu().querySelector<HTMLElement>(":scope > div");
    // 20 items at the default 40px item height.
    expect(spacer()?.style.height).toBe("800px");

    await rerenderField(fields(40));
    await tick();

    expect(spacer()?.style.height).toBe("1600px");
    await scrollMenu({
      scrollTop: 1400,
      scrollHeight: 1600,
      clientHeight: 200,
    });
    expect(onScrollend).toHaveBeenCalledTimes(2);
  });

  it("still forwards the raw DOM scroll event", async () => {
    const { onScroll } = setup(40);

    await scrollMenu({ scrollTop: 100, scrollHeight: 1000, clientHeight: 200 });

    expect(onScroll).toHaveBeenCalled();
  });

  it("works when opened via user interaction", async () => {
    const { onScrollend } = setup(40, false);

    await user.click(field());
    await scrollMenu(nearBottom);

    expect(onScrollend).toHaveBeenCalledTimes(1);
  });
});
