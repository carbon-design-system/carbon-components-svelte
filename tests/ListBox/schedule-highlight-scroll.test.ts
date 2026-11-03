import { scheduleHighlightScroll } from "../../src/ListBox/menu-window.js";

/** A stand-in for `createMenuWindow`'s return value. */
function buildMenuWindow() {
  return {
    update: vi.fn(),
    scrollIntoView: vi.fn(),
    sync: vi.fn(),
    noteScroll: vi.fn(),
    reset: vi.fn(),
    destroy: vi.fn(),
  };
}

const baseOptions = {
  open: true,
  shouldVirtualize: true,
  highlightedIndex: 2,
  prevHighlightedIndex: 1,
  listRef: document.createElement("ul"),
};

describe("scheduleHighlightScroll", () => {
  it("returns highlightedIndex unchanged as the new prevHighlightedIndex", () => {
    const menuWindow = buildMenuWindow();
    const next = scheduleHighlightScroll({ ...baseOptions, menuWindow });
    expect(next).toBe(2);
  });

  it("scrolls the highlighted option into view once ticked", async () => {
    const menuWindow = buildMenuWindow();
    scheduleHighlightScroll({ ...baseOptions, menuWindow });

    await Promise.resolve();
    await Promise.resolve();

    expect(menuWindow.scrollIntoView).toHaveBeenCalledWith(2, "nearest");
  });

  it("does nothing when the menu is closed", async () => {
    const menuWindow = buildMenuWindow();
    const next = scheduleHighlightScroll({
      ...baseOptions,
      open: false,
      menuWindow,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(next).toBe(1);
    expect(menuWindow.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when not virtualized", async () => {
    const menuWindow = buildMenuWindow();
    const next = scheduleHighlightScroll({
      ...baseOptions,
      shouldVirtualize: false,
      menuWindow,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(next).toBe(1);
    expect(menuWindow.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when the index did not change", async () => {
    const menuWindow = buildMenuWindow();
    const next = scheduleHighlightScroll({
      ...baseOptions,
      highlightedIndex: 1,
      prevHighlightedIndex: 1,
      menuWindow,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(next).toBe(1);
    expect(menuWindow.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when highlightedIndex is negative", async () => {
    const menuWindow = buildMenuWindow();
    const next = scheduleHighlightScroll({
      ...baseOptions,
      highlightedIndex: -1,
      menuWindow,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(next).toBe(1);
    expect(menuWindow.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when there is no list ref", async () => {
    const menuWindow = buildMenuWindow();
    const next = scheduleHighlightScroll({
      ...baseOptions,
      listRef: null,
      menuWindow,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(next).toBe(1);
    expect(menuWindow.scrollIntoView).not.toHaveBeenCalled();
  });
});
