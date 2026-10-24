import {
  isTruncated,
  observeTruncation,
} from "../../src/Tag/tag-truncation.js";

describe("isTruncated", () => {
  function sized(scrollWidth: number, clientWidth: number) {
    const node = document.createElement("span");
    Object.defineProperty(node, "scrollWidth", { value: scrollWidth });
    Object.defineProperty(node, "clientWidth", { value: clientWidth });
    return node;
  }

  it.each([
    [200, 40, true],
    [41, 40, true],
    [40, 40, false],
    [0, 0, false],
  ])("scrollWidth %i, clientWidth %i: %s", (scrollWidth, clientWidth, want) => {
    expect(isTruncated(sized(scrollWidth, clientWidth))).toBe(want);
  });

  it("observeTruncation reports after the first layout and stops", async () => {
    const node = sized(200, 40);
    const callback = vi.fn();

    const stop = observeTruncation(node, callback);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledExactlyOnceWith(true);

    // A new subscriber queues a fresh entry for the node; the stopped one
    // no longer hears it.
    stop();
    const next = vi.fn();
    observeTruncation(node, next);
    await Promise.resolve();
    expect(next).toHaveBeenCalledExactlyOnceWith(true);
    expect(callback).toHaveBeenCalledOnce();
  });
});
