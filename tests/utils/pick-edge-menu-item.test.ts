// @vitest-environment node
import { pickEdgeMenuItem } from "../../src/utils/pick-edge-menu-item.js";

describe("pickEdgeMenuItem", () => {
  const items = ["a", "b", "c"];

  it("picks the first item for ArrowDown", () => {
    expect(pickEdgeMenuItem("ArrowDown", items)).toBe("a");
  });

  it("picks the last item for ArrowUp", () => {
    expect(pickEdgeMenuItem("ArrowUp", items)).toBe("c");
  });

  it("returns undefined for an empty list", () => {
    expect(pickEdgeMenuItem("ArrowDown", [])).toBeUndefined();
    expect(pickEdgeMenuItem("ArrowUp", [])).toBeUndefined();
  });
});
