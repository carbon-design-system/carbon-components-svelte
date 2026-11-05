// @vitest-environment node
import { autoUpdate } from "../../src/utils/auto-update.js";
import { caretAnchor, pointAnchor } from "../../src/utils/virtual-anchor.js";

describe("on a server", () => {
  it("autoUpdate listens for nothing and returns a stop", () => {
    const update = vi.fn();
    const stop = autoUpdate(
      { getBoundingClientRect: () => ({}) as DOMRect },
      null,
      update,
    );
    expect(update).not.toHaveBeenCalled();
    stop.update();
    expect(() => stop()).not.toThrow();
  });

  it("a point anchor needs no document, and a caret anchor answers a zero rect", () => {
    expect(pointAnchor(4, 5).getBoundingClientRect()).toMatchObject({
      left: 4,
      top: 5,
      width: 0,
    });
    const field = { value: "ab", selectionStart: 1 } as HTMLInputElement;
    expect(caretAnchor(field).getBoundingClientRect()).toMatchObject({
      left: 0,
      top: 0,
    });
  });
});
