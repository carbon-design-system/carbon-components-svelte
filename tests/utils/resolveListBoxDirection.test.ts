import type { RectLike } from "../../src/utils/floatingPosition.js";
import { resolveListBoxDirection } from "../../src/utils/resolveListBoxDirection.js";

/** Build a RectLike from x/y/width/height (right/bottom derived). */
function rect(x: number, y: number, width: number, height: number): RectLike {
  return {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    width,
    height,
  };
}

const viewport = {
  innerWidth: 1000,
  innerHeight: 800,
};

describe("resolveListBoxDirection", () => {
  test("returns explicit bottom and top unchanged", () => {
    expect(resolveListBoxDirection("bottom")).toBe("bottom");
    expect(resolveListBoxDirection("top")).toBe("top");
  });

  test('defaults "auto" to bottom without geometry', () => {
    expect(resolveListBoxDirection("auto")).toBe("bottom");
  });

  test('keeps "auto" as bottom when there is room below', () => {
    expect(
      resolveListBoxDirection("auto", {
        anchorRect: rect(100, 200, 150, 40),
        floatingRect: rect(0, 0, 150, 60),
        viewport,
      }),
    ).toBe("bottom");
  });

  test('flips "auto" to top when the menu would clip below', () => {
    expect(
      resolveListBoxDirection("auto", {
        anchorRect: rect(100, 750, 150, 40),
        floatingRect: rect(0, 0, 150, 200),
        viewport,
      }),
    ).toBe("top");
  });
});
