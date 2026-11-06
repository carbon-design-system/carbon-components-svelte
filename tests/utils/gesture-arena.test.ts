import {
  createArena,
  createExternalPinch,
  normalizeOptions,
} from "../../src/utils/gesture-arena.js";
import type {
  GestureEvent,
  GestureHandler,
  GestureOptions,
} from "../../src/utils/gesture.js";

function setup(options: GestureOptions) {
  const host = {
    setTimer: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimer: (id: unknown) => clearTimeout(id as number),
    capture: vi.fn(),
    lockScroll: vi.fn(),
    suppressClick: vi.fn(),
  };
  let config = normalizeOptions(options);
  const arena = createArena(() => config, host);
  const input = (
    pointerId: number,
    x: number,
    y: number,
    time: number,
    pointerType = "touch",
  ) => ({ pointerId, pointerType, clientX: x, clientY: y, time, button: 0 });
  return {
    arena,
    host,
    input,
    configure(next: GestureOptions) {
      config = normalizeOptions(next);
    },
  };
}

describe("gesture arena: tap", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("taps on a quick release that stays put", () => {
    const onTap = vi.fn<GestureHandler>();
    const { arena, input, host } = setup({ tap: onTap });
    arena.down(input(1, 10, 10, 0));
    arena.move(input(1, 13, 12, 20));
    arena.up(input(1, 13, 12, 60));
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTap.mock.calls[0][0]).toMatchObject({
      type: "tap",
      clientX: 13,
      startX: 10,
      pointerType: "touch",
    });
    expect(host.suppressClick).not.toHaveBeenCalled();
    expect(arena.active).toBe(false);
  });

  it("does not tap after moving past the tolerance, holding too long, or a second finger", () => {
    const onTap = vi.fn<GestureHandler>();
    const { arena, input } = setup({ tap: onTap });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 30, 0, 10));
    arena.up(input(1, 30, 0, 20));

    arena.down(input(1, 0, 0, 1000));
    arena.up(input(1, 0, 0, 1600));

    arena.down(input(1, 0, 0, 2000));
    arena.down(input(2, 50, 0, 2010));
    arena.up(input(2, 50, 0, 2030));
    arena.up(input(1, 0, 0, 2040));
    expect(onTap).not.toHaveBeenCalled();
  });

  it("ignores a mouse's secondary button", () => {
    const onTap = vi.fn<GestureHandler>();
    const { arena, input } = setup({ tap: onTap });
    expect(arena.down({ ...input(1, 0, 0, 0, "mouse"), button: 2 })).toBe(
      false,
    );
    expect(arena.active).toBe(false);
  });

  it("only starts presses from the pointer types asked for", () => {
    const onTap = vi.fn<GestureHandler>();
    const { arena, input } = setup({ tap: onTap, pointerTypes: ["touch"] });
    expect(arena.down(input(1, 0, 0, 0, "mouse"))).toBe(false);
    expect(arena.down(input(2, 0, 0, 0, "pen"))).toBe(false);
    expect(arena.down(input(3, 0, 0, 0, "touch"))).toBe(true);
  });

  it("tracks nothing while disabled", () => {
    const { arena, input } = setup({
      enabled: false,
      tap: vi.fn<GestureHandler>(),
    });
    expect(arena.down(input(1, 0, 0, 0))).toBe(false);
  });
});

describe("gesture arena: double tap", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function tap(
    arena: ReturnType<typeof setup>["arena"],
    input: ReturnType<typeof setup>["input"],
    x: number,
    time: number,
  ) {
    arena.down(input(1, x, 0, time));
    arena.up(input(1, x, 0, time + 30));
  }

  it("fires on two close taps and never reports them as taps", () => {
    const onTap = vi.fn<GestureHandler>();
    const onDoubleTap = vi.fn<GestureHandler>();
    const { arena, input } = setup({ tap: onTap, doubleTap: onDoubleTap });
    tap(arena, input, 10, 0);
    tap(arena, input, 14, 150);
    vi.advanceTimersByTime(1000);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();
  });

  it("holds a tap back until the double tap window has passed", () => {
    const onTap = vi.fn<GestureHandler>();
    const { arena, input } = setup({
      tap: onTap,
      doubleTap: vi.fn<GestureHandler>(),
    });
    tap(arena, input, 10, 0);
    expect(onTap).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(onTap).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("needs the second tap in time and close by", () => {
    const onDoubleTap = vi.fn<GestureHandler>();
    const { arena, input } = setup({ doubleTap: onDoubleTap });
    tap(arena, input, 10, 0);
    tap(arena, input, 10, 400);
    tap(arena, input, 200, 600);
    expect(onDoubleTap).not.toHaveBeenCalled();
    tap(arena, input, 205, 700);
    expect(onDoubleTap).toHaveBeenCalledTimes(1);
  });
});

describe("gesture arena: long press", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once after the delay and ends on release", () => {
    const onLongPress = vi.fn<GestureHandler>();
    const onEnd = vi.fn<GestureHandler>();
    const onTap = vi.fn<GestureHandler>();
    const { arena, input, host } = setup({
      tap: onTap,
      longPress: { onLongPress, onEnd },
    });
    arena.down(input(1, 5, 5, 0));
    vi.advanceTimersByTime(499);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress.mock.calls[0][0]).toMatchObject({ type: "longpress" });
    arena.up(input(1, 5, 5, 700));
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ cancelled: false, reason: "release" }),
    );
    expect(onTap).not.toHaveBeenCalled();
    expect(host.suppressClick).toHaveBeenCalledTimes(1);
  });

  it("hands off to a pan: the pan ends, the hold does not end twice", () => {
    const onHoldEnd = vi.fn<GestureHandler>();
    const onPanEnd = vi.fn<GestureHandler>();
    const { arena, input } = setup({
      longPress: { onLongPress: vi.fn<GestureHandler>(), onEnd: onHoldEnd },
      pan: { touch: "afterLongPress", onEnd: onPanEnd },
    });
    arena.down(input(1, 0, 0, 0));
    vi.advanceTimersByTime(600);
    arena.move(input(1, 0, 20, 700));
    arena.up(input(1, 0, 20, 760));
    expect(onPanEnd).toHaveBeenCalledTimes(1);
    expect(onHoldEnd).not.toHaveBeenCalled();
  });

  it("holds through finger jitter and gives up past the tolerance", () => {
    const onLongPress = vi.fn<GestureHandler>();
    const { arena, input } = setup({ longPress: onLongPress });
    arena.down(input(1, 100, 100, 0));
    arena.move(input(1, 103, 101, 100));
    arena.move(input(1, 98, 104, 200));
    vi.advanceTimersByTime(600);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    arena.up(input(1, 98, 104, 700));

    arena.down(input(1, 100, 100, 1000));
    arena.move(input(1, 100, 125, 1100));
    vi.advanceTimersByTime(600);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    arena.up(input(1, 100, 125, 1700));
  });

  it("does not fire when released early or when a second finger lands", () => {
    const onLongPress = vi.fn<GestureHandler>();
    const { arena, input } = setup({ longPress: onLongPress });
    arena.down(input(1, 0, 0, 0));
    vi.advanceTimersByTime(300);
    arena.up(input(1, 0, 0, 300));
    vi.advanceTimersByTime(1000);

    arena.down(input(1, 0, 0, 2000));
    vi.advanceTimersByTime(200);
    arena.down(input(2, 40, 0, 2200));
    vi.advanceTimersByTime(1000);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("cancels the hold when the browser takes the pointer", () => {
    const onEnd = vi.fn<GestureHandler>();
    const { arena, input } = setup({
      longPress: { onLongPress: vi.fn<GestureHandler>(), onEnd },
    });
    arena.down(input(1, 0, 0, 0));
    vi.advanceTimersByTime(600);
    arena.cancel("cancel");
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ cancelled: true, reason: "cancel" }),
    );
    expect(arena.active).toBe(false);
  });
});

describe("gesture arena: pan", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts past the threshold with the whole distance in the first move", () => {
    const onStart = vi.fn<GestureHandler>();
    const onMove = vi.fn<GestureHandler>();
    const onEnd = vi.fn<GestureHandler>();
    const onTap = vi.fn<GestureHandler>();
    const { arena, input, host } = setup({
      tap: onTap,
      pan: { onStart, onMove, onEnd },
    });
    arena.down(input(1, 0, 0, 0, "mouse"));
    arena.move(input(1, 3, 0, 10, "mouse"));
    expect(onStart).not.toHaveBeenCalled();
    arena.move(input(1, 6, 0, 20, "mouse"));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0]).toMatchObject({ deltaX: 0, clientX: 0 });
    expect(onMove.mock.calls[0][0]).toMatchObject({ deltaX: 6, startX: 0 });
    expect(host.capture).toHaveBeenCalledWith(1);
    arena.move(input(1, 20, 4, 40, "mouse"));
    arena.up(input(1, 40, 4, 60, "mouse"));
    expect(onMove).toHaveBeenCalledTimes(2);
    const end = onEnd.mock.calls[0][0];
    expect(end).toMatchObject({
      cancelled: false,
      reason: "release",
      deltaX: 40,
    });
    expect(end.velocityX).toBeGreaterThan(0.5);
    expect(onTap).not.toHaveBeenCalled();
    expect(host.suppressClick).toHaveBeenCalledTimes(1);
  });

  it("asks a finger for more movement than a mouse", () => {
    const onStart = vi.fn<GestureHandler>();
    const { arena, input } = setup({ pan: { onStart } });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 6, 0, 10));
    expect(onStart).not.toHaveBeenCalled();
    arena.move(input(1, 9, 0, 20));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("gives up when the press runs along the other axis", () => {
    const onStart = vi.fn<GestureHandler>();
    const { arena, input } = setup({ pan: { axis: "x", onStart } });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 2, 20, 20));
    arena.move(input(1, 40, 25, 40));
    expect(onStart).not.toHaveBeenCalled();
  });

  it("ends as cancelled when the browser takes the pointer", () => {
    const onEnd = vi.fn<GestureHandler>();
    const onSwipe = vi.fn<GestureHandler>();
    const { arena, input } = setup({ pan: { onEnd }, swipe: onSwipe });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 30, 0, 20));
    arena.cancel("cancel");
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ cancelled: true, reason: "cancel" }),
    );
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("waits for a long press when a finger may only pan after one", () => {
    const onStart = vi.fn<GestureHandler>();
    const onLongPress = vi.fn<GestureHandler>();
    const { arena, input, host } = setup({
      longPress: onLongPress,
      pan: { touch: "afterLongPress", onStart },
    });

    // A swipe before the hold belongs to the page.
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 0, 30, 50));
    arena.move(input(1, 0, 60, 100));
    vi.advanceTimersByTime(1000);
    arena.up(input(1, 0, 60, 1100));
    expect(onStart).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();

    // Held, then dragged: the first movement starts the pan.
    arena.down(input(1, 0, 0, 2000));
    vi.advanceTimersByTime(600);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(host.lockScroll).toHaveBeenCalledWith(true);
    expect(host.capture).toHaveBeenCalledWith(1);
    expect(onStart).not.toHaveBeenCalled();
    arena.move(input(1, 0, 2, 2700));
    expect(onStart).toHaveBeenCalledTimes(1);
    arena.up(input(1, 0, 40, 2800));
    expect(host.lockScroll).toHaveBeenLastCalledWith(false);
  });

  it("lets a mouse pan at once even when a finger must hold first", () => {
    const onStart = vi.fn<GestureHandler>();
    const { arena, input } = setup({
      longPress: vi.fn<GestureHandler>(),
      pan: { touch: "afterLongPress", onStart },
    });
    arena.down(input(1, 0, 0, 0, "mouse"));
    arena.move(input(1, 8, 0, 20, "mouse"));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("lets the pan win over a hold that is still possible", () => {
    const onLongPress = vi.fn<GestureHandler>();
    const onStart = vi.fn<GestureHandler>();
    const { arena, input } = setup({
      longPress: onLongPress,
      pan: { onStart },
    });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 9, 0, 100));
    vi.advanceTimersByTime(1000);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});

describe("gesture arena: pinch", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports scale, rotation and the midpoint from two fingers", () => {
    const onStart = vi.fn<GestureHandler>();
    const onChange = vi.fn<GestureHandler>();
    const onEnd = vi.fn<GestureHandler>();
    const { arena, input, host } = setup({
      pinch: { onStart, onChange, onEnd },
    });
    arena.down(input(1, 100, 100, 0));
    arena.down(input(2, 200, 100, 5));
    arena.move(input(2, 202, 100, 10));
    expect(onStart).not.toHaveBeenCalled();
    arena.move(input(2, 300, 100, 20));
    expect(onStart.mock.calls[0][0]).toMatchObject({ scale: 1, rotation: 0 });
    expect(host.capture).toHaveBeenCalledWith(1);
    expect(host.capture).toHaveBeenCalledWith(2);
    const first = onChange.mock.calls[0][0];
    expect(first.scale).toBeCloseTo(2);
    expect(first.deltaScale).toBeCloseTo(2);
    expect(first.clientX).toBeCloseTo(200);
    expect(first.startX).toBeCloseTo(150);

    // Turn the second finger a quarter turn about the first: same span.
    arena.move(input(2, 100, 300, 40));
    const turned = onChange.mock.calls.at(-1)?.[0] as GestureEvent;
    expect(turned.scale).toBeCloseTo(2);
    expect(turned.deltaScale).toBeCloseTo(1);
    expect(turned.rotation).toBeCloseTo(Math.PI / 2);

    arena.up(input(2, 100, 300, 60));
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ cancelled: false, reason: "release" }),
    );
  });

  it("ends a pan that a second finger turns into a pinch, then pans with the finger left", () => {
    const calls: string[] = [];
    const reasons: unknown[] = [];
    const { arena, input } = setup({
      pan: {
        onStart: () => calls.push("pan-start"),
        onEnd: (e) => {
          calls.push("pan-end");
          reasons.push(e.reason);
        },
      },
      pinch: {
        onStart: () => calls.push("pinch-start"),
        onEnd: () => calls.push("pinch-end"),
      },
    });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 30, 0, 20));
    arena.down(input(2, 130, 0, 40));
    arena.move(input(2, 230, 0, 60));
    arena.up(input(2, 230, 0, 80));
    arena.move(input(1, 30, 4, 100));
    arena.move(input(1, 30, 20, 120));
    arena.up(input(1, 30, 20, 140));
    expect(calls).toEqual([
      "pan-start",
      "pan-end",
      "pinch-start",
      "pinch-end",
      "pan-start",
      "pan-end",
    ]);
    expect(reasons[0]).toBe("superseded");
  });

  it("keeps panning with one finger when a second lands and no pinch is asked for", () => {
    const onMove = vi.fn<GestureHandler>();
    const onEnd = vi.fn<GestureHandler>();
    const { arena, input } = setup({ pan: { onMove, onEnd } });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 20, 0, 20));
    arena.down(input(2, 100, 0, 30));
    arena.move(input(2, 150, 0, 40));
    arena.move(input(1, 30, 0, 50));
    expect(onMove).toHaveBeenCalledTimes(2);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("ignores a third finger and fingers of another pointer type", () => {
    const { arena, input } = setup({ pinch: vi.fn<GestureHandler>() });
    arena.down(input(1, 0, 0, 0));
    expect(arena.down(input(2, 10, 0, 0, "mouse"))).toBe(false);
    expect(arena.down(input(3, 10, 0, 0))).toBe(true);
    expect(arena.down(input(4, 20, 0, 0))).toBe(false);
  });
});

describe("gesture arena: swipe", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("recognizes a quick flick and reports its direction and velocity", () => {
    const onSwipe = vi.fn<GestureHandler>();
    const { arena, input, host } = setup({ swipe: onSwipe });
    arena.down(input(1, 200, 50, 0));
    arena.move(input(1, 150, 52, 40));
    arena.move(input(1, 100, 53, 80));
    arena.up(input(1, 90, 54, 90));
    expect(onSwipe).toHaveBeenCalledTimes(1);
    const event = onSwipe.mock.calls[0][0];
    expect(event.direction).toBe("left");
    expect(event.velocityX).toBeLessThan(-0.5);
    expect(host.suppressClick).toHaveBeenCalled();
  });

  it("is not a swipe when slow, short, or along the other axis", () => {
    const onSwipe = vi.fn<GestureHandler>();
    const { arena, input } = setup({ swipe: onSwipe });
    // Slow drag.
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 100, 0, 1000));
    arena.up(input(1, 120, 0, 2000));
    // Short flick.
    arena.down(input(1, 0, 0, 3000));
    arena.up(input(1, 20, 0, 3020));
    // Fast but vertical.
    arena.down(input(1, 0, 0, 4000));
    arena.move(input(1, 2, 60, 4030));
    arena.up(input(1, 4, 120, 4060));
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("is not a swipe when the finger stopped before release", () => {
    const onSwipe = vi.fn<GestureHandler>();
    const { arena, input } = setup({ swipe: onSwipe });
    arena.down(input(1, 0, 0, 0));
    arena.move(input(1, 100, 0, 40));
    arena.up(input(1, 100, 0, 600));
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("follows a vertical axis, and fires after the pan it ends", () => {
    const order: string[] = [];
    const { arena, input } = setup({
      pan: { axis: "y", onEnd: () => order.push("pan-end") },
      swipe: { axis: "y", onSwipe: (e) => order.push(`swipe-${e.direction}`) },
    });
    arena.down(input(1, 0, 200, 0));
    arena.move(input(1, 0, 150, 30));
    arena.move(input(1, 1, 80, 60));
    arena.up(input(1, 1, 60, 70));
    expect(order).toEqual(["pan-end", "swipe-up"]);
  });

  it("does not swipe after a long press", () => {
    const onSwipe = vi.fn<GestureHandler>();
    const { arena, input } = setup({
      swipe: onSwipe,
      longPress: vi.fn<GestureHandler>(),
    });
    arena.down(input(1, 200, 0, 0));
    vi.advanceTimersByTime(600);
    arena.move(input(1, 100, 0, 640));
    arena.up(input(1, 20, 0, 660));
    expect(onSwipe).not.toHaveBeenCalled();
  });
});

describe("gesture arena: lifecycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reads options at every input, so a handler can change mid-press", () => {
    const first = vi.fn<GestureHandler>();
    const second = vi.fn<GestureHandler>();
    const { arena, input, configure } = setup({ tap: first });
    arena.down(input(1, 0, 0, 0));
    configure({ tap: second });
    arena.up(input(1, 0, 0, 30));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("cancels an active pan with a reason when destroyed", () => {
    const onEnd = vi.fn<GestureHandler>();
    const { arena, input } = setup({ pan: { onEnd } });
    arena.down(input(1, 0, 0, 0, "mouse"));
    arena.move(input(1, 20, 0, 20, "mouse"));
    arena.destroy();
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ cancelled: true, reason: "disabled" }),
    );
  });

  it("forgets a pending tap when destroyed", () => {
    const onTap = vi.fn<GestureHandler>();
    const { arena, input } = setup({
      tap: onTap,
      doubleTap: vi.fn<GestureHandler>(),
    });
    arena.down(input(1, 0, 0, 0));
    arena.up(input(1, 0, 0, 30));
    arena.destroy();
    vi.advanceTimersByTime(1000);
    expect(onTap).not.toHaveBeenCalled();
  });
});

describe("external pinch", () => {
  it("builds a pinch from wheel factors and ends it", () => {
    const onStart = vi.fn<GestureHandler>();
    const onChange = vi.fn<GestureHandler>();
    const onEnd = vi.fn<GestureHandler>();
    const config = normalizeOptions({ pinch: { onStart, onChange, onEnd } });
    const external = createExternalPinch(() => config);
    external.change("wheel", { factor: 2, clientX: 5, clientY: 6 });
    external.change("wheel", { factor: 1.5, clientX: 5, clientY: 6 });
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({
      scale: 2,
      deltaScale: 2,
      source: "wheel",
    });
    expect(onChange.mock.calls[1][0].scale).toBeCloseTo(3);
    expect(onChange.mock.calls[1][0].deltaScale).toBeCloseTo(1.5);
    external.end();
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ scale: 3, cancelled: false }),
    );
    expect(external.active).toBe(false);
  });

  it("takes an absolute scale from Safari's gesture events", () => {
    const onChange = vi.fn<GestureHandler>();
    const config = normalizeOptions({ pinch: { onChange } });
    const external = createExternalPinch(() => config);
    external.change("gesture", { scale: 1, clientX: 0, clientY: 0 });
    external.change("gesture", {
      scale: 1.4,
      rotation: 0.5,
      clientX: 0,
      clientY: 0,
    });
    const last = onChange.mock.calls.at(-1)?.[0] as GestureEvent;
    expect(last).toMatchObject({
      scale: 1.4,
      rotation: 0.5,
      source: "gesture",
    });
    expect(last.deltaScale).toBeCloseTo(1.4);
  });
});
