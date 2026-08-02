import {
  createScrollEndTracker,
  DEFAULT_SCROLL_END_THRESHOLD,
  isScrollNearEnd,
} from "../../src/utils/isScrollNearEnd.js";

describe("isScrollNearEnd", () => {
  test("false when content does not overflow", () => {
    expect(
      isScrollNearEnd({
        scrollTop: 0,
        scrollHeight: 200,
        clientHeight: 200,
      }),
    ).toBe(false);
    expect(
      isScrollNearEnd({
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 200,
      }),
    ).toBe(false);
  });

  test("false when scrolled away from the bottom", () => {
    expect(
      isScrollNearEnd({
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 200,
      }),
    ).toBe(false);
    expect(
      isScrollNearEnd({
        scrollTop: 700,
        scrollHeight: 1000,
        clientHeight: 200,
        threshold: 32,
      }),
    ).toBe(false);
  });

  test("true at and within the default threshold of the bottom", () => {
    // Distance from bottom: 1000 - (768 + 200) = 32
    expect(
      isScrollNearEnd({
        scrollTop: 768,
        scrollHeight: 1000,
        clientHeight: 200,
      }),
    ).toBe(true);
    expect(
      isScrollNearEnd({
        scrollTop: 800,
        scrollHeight: 1000,
        clientHeight: 200,
      }),
    ).toBe(true);
  });

  test("respects a custom threshold", () => {
    expect(
      isScrollNearEnd({
        scrollTop: 750,
        scrollHeight: 1000,
        clientHeight: 200,
        threshold: 50,
      }),
    ).toBe(true);
    expect(
      isScrollNearEnd({
        scrollTop: 750,
        scrollHeight: 1000,
        clientHeight: 200,
        threshold: 49,
      }),
    ).toBe(false);
  });

  test("exports the default threshold constant", () => {
    expect(DEFAULT_SCROLL_END_THRESHOLD).toBe(32);
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

  test("fires once when approaching the bottom", () => {
    const tracker = createScrollEndTracker();

    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
    expect(tracker.observe(nearBottom)).toBeNull();
    expect(tracker.observe({ ...nearBottom, scrollTop: 850 })).toBeNull();
  });

  test("re-arms after scrolling away from the bottom", () => {
    const tracker = createScrollEndTracker();

    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
    expect(tracker.observe(awayFromBottom)).toBeNull();
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
  });

  test("re-arms when the item count grows", () => {
    const tracker = createScrollEndTracker();

    expect(tracker.observe({ ...nearBottom, itemCount: 20 })).toEqual(
      nearBottom,
    );

    expect(tracker.observe({ ...nearBottom, itemCount: 40 })).toEqual(
      nearBottom,
    );
  });

  test("re-arms via noteItemCount when the item count grows", () => {
    const tracker = createScrollEndTracker();

    tracker.noteItemCount(20);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);

    tracker.noteItemCount(40);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
  });

  test("does not re-arm when the item count stays the same or shrinks", () => {
    const tracker = createScrollEndTracker();

    tracker.noteItemCount(40);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);

    tracker.noteItemCount(40);
    expect(tracker.observe(nearBottom)).toBeNull();

    tracker.noteItemCount(30);
    expect(tracker.observe(nearBottom)).toBeNull();
  });

  test("reset re-arms and clears the item count baseline", () => {
    const tracker = createScrollEndTracker();

    tracker.noteItemCount(20);
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);

    tracker.reset();
    expect(tracker.observe(nearBottom)).toEqual(nearBottom);
  });

  test("does not re-arm when leaving a non-overflowing list", () => {
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
