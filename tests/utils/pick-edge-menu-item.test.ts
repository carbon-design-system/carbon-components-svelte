import { pickEdgeMenuItem } from "../../src/utils/pick-edge-menu-item.js";

describe("pickEdgeMenuItem", () => {
  const items = ["a", "b", "c"];

  test("picks the first item for ArrowDown", () => {
    expect(pickEdgeMenuItem("ArrowDown", items)).toBe("a");
  });

  test("picks the last item for ArrowUp", () => {
    expect(pickEdgeMenuItem("ArrowUp", items)).toBe("c");
  });

  test("returns undefined for an empty list", () => {
    expect(pickEdgeMenuItem("ArrowDown", [])).toBeUndefined();
    expect(pickEdgeMenuItem("ArrowUp", [])).toBeUndefined();
  });
});
