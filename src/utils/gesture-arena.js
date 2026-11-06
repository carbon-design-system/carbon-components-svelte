// @ts-check

/**
 * @typedef {import("./gesture.js").GestureOptions} GestureOptions
 * @typedef {import("./gesture.js").GestureEvent} GestureEvent
 * @typedef {import("./gesture.js").GestureEndReason} GestureEndReason
 */

import {
  angleDelta,
  createVelocityTracker,
  pinchGeometry,
  swipeDirection,
} from "./gesture-math.js";

/**
 * Presses that start on one of these are left alone: they are controls with
 * their own pointer behavior, and capturing the pointer would retarget the
 * click they are waiting for.
 */
export const DEFAULT_IGNORE =
  "input, textarea, select, button, a[href], [contenteditable]:not([contenteditable='false']), [data-gesture-ignore]";

const DEFAULTS = {
  tap: { tolerance: 10, maxDuration: 500 },
  doubleTap: { interval: 300, distance: 30 },
  longPress: { delay: 500, tolerance: 10 },
  pan: { axis: "both", threshold: 4, touchThreshold: 8, touch: "immediate" },
  pinch: { threshold: 4, wheel: true },
  swipe: { axis: "x", minDistance: 30, minVelocity: 0.3 },
};

/** After a long press, any movement at all starts the pan. */
const HOLD_PAN_THRESHOLD = 1;

/**
 * Defaults first, then the options that are set. An option set to
 * `undefined` keeps its default.
 *
 * @template T
 * @param {T} defaults
 * @param {Record<string, unknown>} options
 * @returns {T}
 */
function merge(defaults, options) {
  const result = { ...defaults };
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) /** @type {any} */ (result)[key] = value;
  }
  return result;
}

/**
 * @param {unknown} value
 * @param {string} handler
 * @returns {Record<string, unknown> | null}
 */
function shorthand(value, handler) {
  if (!value) return null;
  if (typeof value === "function") return { [handler]: value };
  return /** @type {Record<string, unknown>} */ (value);
}

/**
 * Fill every recognizer's defaults. A function stands for the recognizer's
 * main handler: `tap: fn` is `tap: { onTap: fn }`.
 *
 * @param {GestureOptions} [options]
 */
export function normalizeOptions(options = {}) {
  const tap = shorthand(options.tap, "onTap");
  const doubleTap = shorthand(options.doubleTap, "onDoubleTap");
  const longPress = shorthand(options.longPress, "onLongPress");
  const pan = shorthand(options.pan, "onMove");
  const pinch = shorthand(options.pinch, "onChange");
  const swipe = shorthand(options.swipe, "onSwipe");
  return {
    enabled: options.enabled !== false,
    pointerTypes: options.pointerTypes ?? null,
    ignore: options.ignore === undefined ? DEFAULT_IGNORE : options.ignore,
    touchAction: options.touchAction,
    // A double tap needs the tap limits even when nobody listens for taps.
    tap:
      tap || doubleTap
        ? /** @type {any} */ (merge(DEFAULTS.tap, tap ?? {}))
        : null,
    doubleTap: doubleTap
      ? /** @type {any} */ (merge(DEFAULTS.doubleTap, doubleTap))
      : null,
    longPress: longPress
      ? /** @type {any} */ (merge(DEFAULTS.longPress, longPress))
      : null,
    pan: pan ? /** @type {any} */ (merge(DEFAULTS.pan, pan)) : null,
    pinch: pinch ? /** @type {any} */ (merge(DEFAULTS.pinch, pinch)) : null,
    swipe: swipe ? /** @type {any} */ (merge(DEFAULTS.swipe, swipe)) : null,
  };
}

/**
 * @typedef {ReturnType<typeof normalizeOptions>} GestureConfig
 *
 * @typedef {{
 *   pointerId: number,
 *   pointerType: string,
 *   clientX: number,
 *   clientY: number,
 *   time: number,
 *   button?: number,
 *   event?: PointerEvent,
 * }} PointerInput
 *
 * @typedef {{
 *   setTimer: (callback: () => void, ms: number) => unknown,
 *   clearTimer: (id: unknown) => void,
 *   capture: (pointerId: number) => void,
 *   lockScroll: (locked: boolean) => void,
 *   suppressClick: () => void,
 * }} ArenaHost
 *
 * @typedef {"possible" | "active" | "failed" | "off"} State
 */

/**
 * The recognizer arena: pure state machines fed with pointer input, no DOM.
 * One press is one session. Every configured recognizer starts as
 * `possible`, and the first to claim the press makes the incompatible ones
 * `failed`:
 *
 * | Claim              | Fails                              | Keeps                    |
 * | ------------------ | ---------------------------------- | ------------------------ |
 * | long press (held)  | tap, double tap, swipe             | pan (armed), pinch       |
 *
 * A hold that goes on to a pan hands off: its `onEnd` does not fire, the
 * pan's does.
 *
 * | pan (moved)        | tap, double tap, long press        | swipe (at release), pinch|
 * | pinch (two moved)  | tap, long press, swipe; ends a pan | pan restarts on one left |
 * | second pointer     | tap, double tap, long press, swipe | pan, pinch               |
 *
 * @param {() => GestureConfig} getConfig Read at every input, so options can
 *   change mid-press.
 * @param {ArenaHost} host
 */
export function createArena(getConfig, host) {
  /** @type {Map<number, { id: number, x: number, y: number, event?: PointerEvent }>} */
  const pointers = new Map();
  /** @type {null | Record<string, any>} */
  let s = null;
  /** @type {{ x: number, y: number, time: number } | null} */
  let lastTap = null;
  /** @type {unknown} */
  let pendingTap = null;

  /**
   * @param {string} type
   * @param {number} id
   * @param {Record<string, unknown>} [extra]
   * @returns {GestureEvent}
   */
  function build(type, id, extra = {}) {
    const state = /** @type {Record<string, any>} */ (s);
    const pt = pointers.get(id) ?? state.lastPoint;
    const origin = type === "pan" ? state.panOrigin : state.start;
    return /** @type {GestureEvent} */ ({
      type,
      source: "pointer",
      pointerId: id,
      pointerType: state.type,
      clientX: pt.x,
      clientY: pt.y,
      startX: origin.x,
      startY: origin.y,
      deltaX: pt.x - origin.x,
      deltaY: pt.y - origin.y,
      timeStamp: state.time,
      originalEvent: pt.event,
      startEvent: state.startEvent,
      ...extra,
    });
  }

  /** @returns {{ x: number, y: number }} */
  function velocity() {
    return /** @type {any} */ (s).velocity.velocity();
  }

  /** @param {number} id */
  function panEvent(id) {
    const v = velocity();
    return build("pan", id, { velocityX: v.x, velocityY: v.y });
  }

  /**
   * @param {boolean} cancelled
   * @param {GestureEndReason} reason
   */
  function endActive(cancelled, reason) {
    const state = /** @type {Record<string, any>} */ (s);
    const cfg = getConfig();
    if (state.pan === "active") {
      state.pan = "failed";
      cfg.pan?.onEnd?.({ ...panEvent(state.panId), cancelled, reason });
    }
    if (state.pinch === "active") {
      state.pinch = "failed";
      cfg.pinch?.onEnd?.({ ...pinchEvent(), cancelled, reason });
    }
    if (state.longPress === "active") {
      state.longPress = "failed";
      cfg.longPress?.onEnd?.({
        ...build("longpress", state.primary),
        cancelled,
        reason,
      });
    }
  }

  function finish() {
    const state = /** @type {Record<string, any>} */ (s);
    if (state.timer != null) host.clearTimer(state.timer);
    host.lockScroll(false);
    if (state.claimed) host.suppressClick();
    pointers.clear();
    s = null;
  }

  /** @param {PointerInput} p */
  function pointOf(p) {
    return { id: p.pointerId, x: p.clientX, y: p.clientY, event: p.event };
  }

  /**
   * @param {PointerInput} p
   * @returns {boolean} Whether the press is tracked.
   */
  function down(p) {
    const cfg = getConfig();
    if (!cfg.enabled) return false;
    if (
      cfg.pointerTypes &&
      !cfg.pointerTypes.includes(/** @type {any} */ (p.pointerType))
    ) {
      return false;
    }
    if (!s) {
      if (p.pointerType === "mouse" && p.button !== 0) return false;
      const gated =
        cfg.pan?.touch === "afterLongPress" &&
        cfg.longPress != null &&
        p.pointerType !== "mouse";
      pointers.set(p.pointerId, pointOf(p));
      s = {
        type: p.pointerType,
        primary: p.pointerId,
        startEvent: p.event,
        start: { x: p.clientX, y: p.clientY, time: p.time },
        lastPoint: pointOf(p),
        time: p.time,
        tap: cfg.tap ? "possible" : "off",
        longPress: cfg.longPress ? "possible" : "off",
        pan: cfg.pan ? "possible" : "off",
        pinch: cfg.pinch ? "possible" : "off",
        swipe: cfg.swipe ? "possible" : "off",
        panId: p.pointerId,
        panOrigin: { x: p.clientX, y: p.clientY },
        panArmed: !gated,
        afterHold: false,
        claimed: false,
        timer: null,
        velocity: createVelocityTracker(),
        pinchBase: null,
        rotation: 0,
        lastAngle: 0,
        lastScale: 1,
      };
      s.velocity.add(p.clientX, p.clientY, p.time);
      if (cfg.longPress) {
        s.timer = host.setTimer(longPressElapsed, cfg.longPress.delay);
      }
      return true;
    }
    if (
      p.pointerType !== s.type ||
      pointers.has(p.pointerId) ||
      pointers.size >= 2
    ) {
      return false;
    }
    pointers.set(p.pointerId, pointOf(p));
    // Two pointers are not a tap, a hold or a swipe.
    s.tap = s.tap === "off" ? "off" : "failed";
    s.swipe = s.swipe === "off" ? "off" : "failed";
    if (s.longPress === "possible") failLongPress();
    if (s.pinch === "possible") s.pinchBase = pinchBase();
    return true;
  }

  function pinchBase() {
    const [a, b] = [...pointers.values()];
    const geometry = pinchGeometry(a, b);
    return { ...geometry, startAngle: geometry.angle };
  }

  function failLongPress() {
    const state = /** @type {Record<string, any>} */ (s);
    state.longPress = "failed";
    if (state.timer != null) host.clearTimer(state.timer);
    state.timer = null;
    // A gated pan was waiting for this hold.
    if (!state.panArmed && state.pan === "possible") state.pan = "failed";
  }

  function longPressElapsed() {
    const state = s;
    if (!state || state.longPress !== "possible") return;
    const cfg = getConfig();
    state.timer = null;
    state.longPress = "active";
    state.claimed = true;
    state.tap = state.tap === "off" ? "off" : "failed";
    state.swipe = state.swipe === "off" ? "off" : "failed";
    if (state.pan === "possible") {
      state.panArmed = true;
      state.afterHold = true;
      // Hand off to the pan: the pointer keeps coming to this node, and a
      // touch stops scrolling.
      host.capture(state.primary);
      if (state.type !== "mouse") host.lockScroll(true);
    }
    cfg.longPress?.onLongPress?.(build("longpress", state.primary));
  }

  /** @param {PointerInput} p */
  function move(p) {
    const state = s;
    if (!state) return;
    const pt = pointers.get(p.pointerId);
    if (!pt) return;
    const cfg = getConfig();
    pt.x = p.clientX;
    pt.y = p.clientY;
    pt.event = p.event;
    state.time = p.time;
    if (p.pointerId === state.panId) {
      state.lastPoint = pt;
      state.velocity.add(p.clientX, p.clientY, p.time);
    }

    if (pointers.size === 2 && cfg.pinch && state.pinch !== "failed") {
      updatePinch(cfg);
    }
    if (state.pinch === "active") return;

    if (p.pointerId === state.primary) {
      const distance = Math.hypot(
        p.clientX - state.start.x,
        p.clientY - state.start.y,
      );
      if (state.tap === "possible" && distance > (cfg.tap?.tolerance ?? 10)) {
        state.tap = "failed";
      }
      if (
        state.longPress === "possible" &&
        distance > (cfg.longPress?.tolerance ?? 10)
      ) {
        failLongPress();
      }
    }

    if (p.pointerId !== state.panId) return;
    if (state.pan === "possible") tryBeginPan(cfg, pt);
    else if (state.pan === "active") cfg.pan?.onMove?.(panEvent(pt.id));
  }

  /**
   * @param {GestureConfig} cfg
   * @param {{ id: number, x: number, y: number }} pt
   */
  function tryBeginPan(cfg, pt) {
    const state = /** @type {Record<string, any>} */ (s);
    const pan = cfg.pan;
    if (!pan || !state.panArmed) return;
    const dx = pt.x - state.panOrigin.x;
    const dy = pt.y - state.panOrigin.y;
    const distance = Math.hypot(dx, dy);
    const threshold = state.afterHold
      ? HOLD_PAN_THRESHOLD
      : state.type === "mouse"
        ? pan.threshold
        : pan.touchThreshold;
    if (distance < threshold) return;
    // A press that goes along the other axis is not this pan's: the page
    // scrolls, or text is selected.
    if (
      !state.afterHold &&
      ((pan.axis === "x" && Math.abs(dy) > Math.abs(dx)) ||
        (pan.axis === "y" && Math.abs(dx) > Math.abs(dy)))
    ) {
      state.pan = "failed";
      return;
    }
    state.pan = "active";
    state.claimed = true;
    state.tap = state.tap === "off" ? "off" : "failed";
    if (state.longPress === "possible") failLongPress();
    // A hold that carries on as a pan ends with the pan, not twice.
    if (state.longPress === "active") state.longPress = "handoff";
    host.capture(pt.id);
    // The start is the press point and the first move carries the whole
    // distance, so a handler that adds up moves loses none of it.
    const origin = state.panOrigin;
    const start = build("pan", pt.id, {
      clientX: origin.x,
      clientY: origin.y,
      deltaX: 0,
      deltaY: 0,
      velocityX: 0,
      velocityY: 0,
    });
    pan.onStart?.(start);
    pan.onMove?.(panEvent(pt.id));
  }

  /** @param {GestureConfig} cfg */
  function updatePinch(cfg) {
    const state = /** @type {Record<string, any>} */ (s);
    const pinch = cfg.pinch;
    if (!pinch || !state.pinchBase) return;
    const [a, b] = [...pointers.values()];
    const geometry = pinchGeometry(a, b);
    const base = state.pinchBase;
    if (state.pinch === "possible") {
      const spread = Math.abs(geometry.distance - base.distance);
      const travel = Math.hypot(
        geometry.center.x - base.center.x,
        geometry.center.y - base.center.y,
      );
      if (Math.max(spread, travel) < pinch.threshold) return;
      // The pinch claims the press: a pan in progress ends, a hold ends.
      endActive(false, "superseded");
      state.pinch = "active";
      state.claimed = true;
      state.tap = state.tap === "off" ? "off" : "failed";
      state.swipe = state.swipe === "off" ? "off" : "failed";
      if (state.longPress === "possible") failLongPress();
      if (state.pan === "possible") state.pan = "failed";
      host.lockScroll(false);
      host.capture(a.id);
      host.capture(b.id);
      state.rotation = 0;
      state.reportedRotation = 0;
      state.lastAngle = base.angle;
      state.lastScale = 1;
      pinch.onStart?.(pinchEvent(base));
    }
    state.rotation += angleDelta(geometry.angle, state.lastAngle);
    state.lastAngle = geometry.angle;
    pinch.onChange?.(pinchEvent(geometry));
  }

  /**
   * @param {{ distance: number, center: { x: number, y: number } }} [geometry]
   *   The current span; the last pair's when left out.
   * @returns {GestureEvent}
   */
  function pinchEvent(geometry) {
    const state = /** @type {Record<string, any>} */ (s);
    const base = state.pinchBase;
    const [a, b] = [...pointers.values()];
    const now = geometry ?? (a && b ? pinchGeometry(a, b) : base);
    const scale = base.distance > 0 ? now.distance / base.distance : 1;
    const deltaScale = state.lastScale > 0 ? scale / state.lastScale : 1;
    const deltaRotation = state.rotation - (state.reportedRotation ?? 0);
    state.lastScale = scale;
    state.reportedRotation = state.rotation;
    return /** @type {GestureEvent} */ ({
      type: "pinch",
      source: "pointer",
      pointerId: state.primary,
      pointerType: state.type,
      clientX: now.center.x,
      clientY: now.center.y,
      startX: base.center.x,
      startY: base.center.y,
      deltaX: now.center.x - base.center.x,
      deltaY: now.center.y - base.center.y,
      scale,
      deltaScale,
      rotation: state.rotation,
      deltaRotation,
      timeStamp: state.time,
      originalEvent: a?.event,
      startEvent: state.startEvent,
    });
  }

  /** @param {PointerInput} p */
  function up(p) {
    const state = s;
    if (!state) return;
    const pt = pointers.get(p.pointerId);
    if (!pt) return;
    const cfg = getConfig();
    pt.x = p.clientX;
    pt.y = p.clientY;
    pt.event = p.event;
    state.time = p.time;

    if (state.pinch === "active") {
      endActive(false, "release");
      state.pinch = "failed";
      pointers.delete(p.pointerId);
      const rest = [...pointers.values()][0];
      if (rest && cfg.pan && state.pan !== "off") {
        // One finger is left: it carries on as a pan from where it is.
        state.pan = "possible";
        state.panId = rest.id;
        state.primary = rest.id;
        state.panOrigin = { x: rest.x, y: rest.y };
        state.panArmed = true;
        state.afterHold = false;
        state.lastPoint = rest;
        state.velocity.reset();
        state.velocity.add(rest.x, rest.y, p.time);
      }
      if (pointers.size === 0) finish();
      return;
    }

    if (p.pointerId === state.panId) {
      state.velocity.add(p.clientX, p.clientY, p.time);
    }
    pointers.delete(p.pointerId);

    if (p.pointerId !== state.primary) {
      if (pointers.size === 0) finish();
      return;
    }
    if (pointers.size > 0) {
      // The first finger lifted while another stays down: not a gesture
      // this arena knows, so the press ends.
      endActive(false, "release");
      state.tap = state.swipe = state.pan = "failed";
      if (state.longPress === "possible") failLongPress();
      state.primary = state.panId = [...pointers.values()][0].id;
      return;
    }

    const duration = p.time - state.start.time;
    const v = velocity();
    const panWasActive = state.pan === "active";
    if (panWasActive) {
      state.pan = "failed";
      cfg.pan?.onEnd?.({
        ...build("pan", p.pointerId, { velocityX: v.x, velocityY: v.y }),
        cancelled: false,
        reason: "release",
      });
    }
    if (state.longPress === "active") {
      state.longPress = "failed";
      cfg.longPress?.onEnd?.({
        ...build("longpress", p.pointerId),
        cancelled: false,
        reason: "release",
      });
    } else if (state.longPress === "possible") {
      failLongPress();
    }

    if (state.swipe === "possible" && cfg.swipe) {
      const direction = swipeDirection({
        dx: p.clientX - state.start.x,
        dy: p.clientY - state.start.y,
        vx: v.x,
        vy: v.y,
        axis: cfg.swipe.axis,
        minDistance: cfg.swipe.minDistance,
        minVelocity: cfg.swipe.minVelocity,
      });
      if (direction) {
        state.claimed = true;
        cfg.swipe.onSwipe?.(
          build("swipe", p.pointerId, {
            direction,
            velocityX: v.x,
            velocityY: v.y,
          }),
        );
      }
    }

    if (state.tap === "possible" && duration <= (cfg.tap?.maxDuration ?? 500)) {
      tapped(cfg, p);
    }
    finish();
  }

  /**
   * @param {GestureConfig} cfg
   * @param {PointerInput} p
   */
  function tapped(cfg, p) {
    const double = cfg.doubleTap;
    const tapEvent = build("tap", p.pointerId);
    if (!double) {
      cfg.tap?.onTap?.(tapEvent);
      return;
    }
    if (
      lastTap &&
      p.time - lastTap.time <= double.interval &&
      Math.hypot(p.clientX - lastTap.x, p.clientY - lastTap.y) <=
        double.distance
    ) {
      if (pendingTap != null) host.clearTimer(pendingTap);
      pendingTap = null;
      lastTap = null;
      double.onDoubleTap?.(build("doubletap", p.pointerId));
      return;
    }
    lastTap = { x: p.clientX, y: p.clientY, time: p.time };
    if (cfg.tap?.onTap) {
      // A tap that might be the first of two waits for the second.
      pendingTap = host.setTimer(() => {
        pendingTap = null;
        lastTap = null;
        getConfig().tap?.onTap?.(tapEvent);
      }, double.interval);
    }
  }

  /** @param {GestureEndReason} reason */
  function cancel(reason = "cancel") {
    if (!s) return;
    endActive(true, reason);
    finish();
  }

  /** Forget a pending tap too, for a node that is going away. */
  function destroy() {
    cancel("disabled");
    if (pendingTap != null) host.clearTimer(pendingTap);
    pendingTap = null;
    lastTap = null;
  }

  return {
    down,
    move,
    up,
    cancel,
    destroy,
    /** Whether a press is being tracked. */
    get active() {
      return s !== null;
    },
    /** Whether a continuous gesture (pan, pinch or hold) has claimed it. */
    get claimed() {
      return s !== null && s.claimed === true;
    },
    /** Whether a pointer other than `pointerId` is part of the press. */
    has(/** @type {number} */ pointerId) {
      return pointers.has(pointerId);
    },
    /** @returns {number} */
    get pointerCount() {
      return pointers.size;
    },
  };
}

/**
 * A pinch that does not come from two pointers: a trackpad on Chromium and
 * Firefox sends `wheel` events with `ctrlKey`, and Safari sends its own
 * `gesture*` events. They end up in the same `pinch` handlers.
 *
 * @param {() => GestureConfig} getConfig
 */
export function createExternalPinch(getConfig) {
  /** @type {null | { source: "wheel" | "gesture", scale: number, rotation: number, startX: number, startY: number }} */
  let state = null;

  /**
   * @param {"wheel" | "gesture"} source
   * @param {{
   *   factor?: number,
   *   scale?: number,
   *   rotation?: number,
   *   clientX: number,
   *   clientY: number,
   *   event?: Event,
   * }} input `factor` multiplies the scale so far; `scale` replaces it.
   */
  function change(source, input) {
    const pinch = getConfig().pinch;
    if (!pinch) return;
    const started = state === null;
    if (!state) {
      state = {
        source,
        scale: 1,
        rotation: 0,
        startX: input.clientX,
        startY: input.clientY,
      };
    }
    const scale = input.scale ?? state.scale * (input.factor ?? 1);
    const rotation = input.rotation ?? state.rotation;
    const event = /** @type {GestureEvent} */ ({
      type: "pinch",
      source,
      pointerId: -1,
      pointerType: source,
      clientX: input.clientX,
      clientY: input.clientY,
      startX: state.startX,
      startY: state.startY,
      deltaX: input.clientX - state.startX,
      deltaY: input.clientY - state.startY,
      scale,
      deltaScale: state.scale > 0 ? scale / state.scale : 1,
      rotation,
      deltaRotation: rotation - state.rotation,
      timeStamp: input.event?.timeStamp ?? 0,
      originalEvent: input.event,
    });
    if (started) {
      pinch.onStart?.({
        ...event,
        scale: 1,
        deltaScale: 1,
        rotation: 0,
        deltaRotation: 0,
      });
    }
    state.scale = scale;
    state.rotation = rotation;
    pinch.onChange?.(event);
  }

  /** @param {{ cancelled?: boolean }} [options] */
  function end(options = {}) {
    if (!state) return;
    const last = state;
    state = null;
    getConfig().pinch?.onEnd?.(
      /** @type {GestureEvent} */ ({
        type: "pinch",
        source: last.source,
        pointerId: -1,
        pointerType: last.source,
        clientX: last.startX,
        clientY: last.startY,
        startX: last.startX,
        startY: last.startY,
        deltaX: 0,
        deltaY: 0,
        scale: last.scale,
        deltaScale: 1,
        rotation: last.rotation,
        deltaRotation: 0,
        timeStamp: 0,
        cancelled: options.cancelled === true,
        reason: options.cancelled ? "cancel" : "release",
      }),
    );
  }

  return {
    change,
    end,
    get active() {
      return state !== null;
    },
  };
}
