import {
  FLUID_MENU_ITEM_HEIGHT,
  getMenuItemHeight,
  getMenuMaxHeight,
  MENU_ITEM_HEIGHT,
  MENU_MAX_HEIGHT,
  shouldVirtualizeMenu,
} from "../../src/ListBox/list-box-utils.js";
import { DEFAULT_VIRTUAL_LIST_CONFIG } from "../../src/utils/virtualize.js";

describe("getMenuMaxHeight", () => {
  it("returns default when size is undefined (optional size guard)", () => {
    expect(getMenuMaxHeight(undefined)).toBe(MENU_MAX_HEIGHT.md);
  });

  it("returns default when called with no args", () => {
    expect(getMenuMaxHeight()).toBe(MENU_MAX_HEIGHT.md);
  });

  it("returns correct value for each size", () => {
    expect(getMenuMaxHeight("xs")).toBe("8.25rem");
    expect(getMenuMaxHeight("sm")).toBe("11rem");
    expect(getMenuMaxHeight("md")).toBe("13.75rem");
    expect(getMenuMaxHeight("lg")).toBe("16.5rem");
    expect(getMenuMaxHeight("xl")).toBe("16.5rem");
  });
});

describe("getMenuItemHeight", () => {
  it("returns default when size is undefined (optional size guard)", () => {
    expect(getMenuItemHeight(undefined)).toBe(MENU_ITEM_HEIGHT.md);
  });

  it("returns default when called with no args", () => {
    expect(getMenuItemHeight()).toBe(MENU_ITEM_HEIGHT.md);
  });

  it("returns correct value for each size", () => {
    expect(getMenuItemHeight("xs")).toBe(24);
    expect(getMenuItemHeight("sm")).toBe(32);
    expect(getMenuItemHeight("md")).toBe(40);
    expect(getMenuItemHeight("lg")).toBe(48);
    expect(getMenuItemHeight("xl")).toBe(48);
  });

  it("returns default for an unknown size", () => {
    // @ts-expect-error - exercising the runtime fallback
    expect(getMenuItemHeight("xxl")).toBe(MENU_ITEM_HEIGHT.md);
  });

  it("returns 64px for every size when fluid is true", () => {
    expect(getMenuItemHeight("sm", { fluid: true })).toBe(
      FLUID_MENU_ITEM_HEIGHT,
    );
    expect(getMenuItemHeight("md", { fluid: true })).toBe(
      FLUID_MENU_ITEM_HEIGHT,
    );
    expect(getMenuItemHeight("lg", { fluid: true })).toBe(
      FLUID_MENU_ITEM_HEIGHT,
    );
    expect(getMenuItemHeight("xl", { fluid: true })).toBe(
      FLUID_MENU_ITEM_HEIGHT,
    );
  });

  it("uses size-based heights when fluid is false", () => {
    expect(getMenuItemHeight("sm", { fluid: false })).toBe(32);
    expect(getMenuItemHeight("lg", { fluid: false })).toBe(48);
  });
});

describe("shouldVirtualizeMenu", () => {
  const items = (count: number) =>
    Array.from({ length: count }, (_, id) => ({ id }));

  it("refuses however long the list runs", () => {
    expect(
      shouldVirtualizeMenu({ items: items(5000), virtualize: false }),
    ).toBe(false);
  });

  it("takes the prop as the ask, whatever the length", () => {
    expect(shouldVirtualizeMenu({ items: items(3), virtualize: true })).toBe(
      true,
    );
    expect(shouldVirtualizeMenu({ items: items(3), virtualize: {} })).toBe(
      true,
    );
  });

  it("windows a list of its own past the threshold, not at it", () => {
    const { threshold } = DEFAULT_VIRTUAL_LIST_CONFIG;

    // `virtualize.js` windows *at* its threshold where this gate windows
    // *past* it. This gate decides first, so this is what a list with no prop
    // gets, and it is what the components did before the gate was extracted.
    expect(
      shouldVirtualizeMenu({ items: items(threshold), virtualize: undefined }),
    ).toBe(false);
    expect(
      shouldVirtualizeMenu({
        items: items(threshold + 1),
        virtualize: undefined,
      }),
    ).toBe(true);
  });
});
