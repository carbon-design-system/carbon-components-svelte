import {
  getMenuMaxHeight,
  MENU_MAX_HEIGHT,
} from "../../src/ListBox/list-box-utils.js";

describe("getMenuMaxHeight", () => {
  it("returns default when size is undefined (optional size guard)", () => {
    expect(getMenuMaxHeight(undefined)).toBe(MENU_MAX_HEIGHT.md);
  });

  it("returns default when called with no args", () => {
    expect(getMenuMaxHeight()).toBe(MENU_MAX_HEIGHT.md);
  });

  it("returns correct value for each size", () => {
    expect(getMenuMaxHeight("sm")).toBe("11rem");
    expect(getMenuMaxHeight("md")).toBe("13.75rem");
    expect(getMenuMaxHeight("lg")).toBe("16.5rem");
    expect(getMenuMaxHeight("xl")).toBe("16.5rem");
  });
});
