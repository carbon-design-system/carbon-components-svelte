// @vitest-environment node
import {
  createScrollEndTracker,
  isScrollNearEnd,
} from "../../src/utils/is-scroll-near-end.js";

describe("isScrollNearEnd", () => {
  it.each<
    [
      {
        scrollTop: number;
        scrollHeight: number;
        clientHeight: number;
        threshold?: number;
      },
      boolean,
    ]
  >([
    // No overflow, equal and shorter.
    [{ scrollTop: 0, scrollHeight: 200, clientHeight: 200 }, false],
    [{ scrollTop: 0, scrollHeight: 100, clientHeight: 200 }, false],
    // The default threshold is 32: 1px outside, then on the boundary.
    [{ scrollTop: 767, scrollHeight: 1000, clientHeight: 200 }, false],
    [{ scrollTop: 768, scrollHeight: 1000, clientHeight: 200 }, true],
    [
      { scrollTop: 750, scrollHeight: 1000, clientHeight: 200, threshold: 50 },
      true,
    ],
    [
      { scrollTop: 750, scrollHeight: 1000, clientHeight: 200, threshold: 49 },
      false,
    ],
  ])("isScrollNearEnd(%o) is %s", (metrics, expected) => {
    expect(isScrollNearEnd(metrics)).toBe(expected);
  });
});

describe("createScrollEndTracker", () => {
  const nearBottom = {
    scrollTop: 800,
    scrollHeight: 1000,
    clientHeight: 200,
  };
  const awayFromBottom = {
    scrollTop: 0,
    scrollHeight: 1000,
    clientHeight: 200,
  };

  it("fires once when approaching the bottom", () => {
    const tracker = createScrollEndTracker();

    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
    expect(tracker.observe(nearBottom)).toBeNull();
  });

  it("re-arms after scrolling away from the bottom", () => {
    const tracker = createScrollEndTracker();

    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
    expect(tracker.observe(awayFromBottom)).toBeNull();
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
  });

  it("re-arms when the item count grows", () => {
    const tracker = createScrollEndTracker();

    expect(tracker.observe({ ...nearBottom, itemCount: 20 })).toEqual(
      nearBottom,
    );

    expect(tracker.observe({ ...nearBottom, itemCount: 40 })).toEqual(
      nearBottom,
    );
  });

  it("re-arms via noteItemCount when the item count grows", () => {
    const tracker = createScrollEndTracker();

    tracker.noteItemCount(20);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);

    tracker.noteItemCount(40);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
  });

  it("does not re-arm when the item count stays the same or shrinks", () => {
    const tracker = createScrollEndTracker();

    tracker.noteItemCount(40);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);

    tracker.noteItemCount(40);
    expect(tracker.observe(nearBottom)).toBeNull();

    tracker.noteItemCount(30);
    expect(tracker.observe(nearBottom)).toBeNull();
  });

  it("reset re-arms and clears the item count baseline", () => {
    const tracker = createScrollEndTracker();

    tracker.noteItemCount(20);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);

    tracker.reset();
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);

    // The baseline is gone too: 40 is the first count seen since the reset,
    // not growth over the 20 from before it.
    tracker.noteItemCount(40);
    expect(tracker.observe(nearBottom)).toBeNull();
  });

  it("does not re-arm when leaving a non-overflowing list", () => {
    const tracker = createScrollEndTracker();

    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
    expect(
      tracker.observe({
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 200,
      }),
    ).toBeNull();
    // Still disarmed until overflow scroll-away or item growth / reset.
    expect(tracker.observe(nearBottom)).toBeNull();
  });
});
