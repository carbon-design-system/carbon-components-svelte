/** Why a continuous gesture ended. */
export type GestureEndReason =
  /** The pointer was released. */
  | "release"
  /** The browser took the pointer, such as to scroll (`pointercancel`). */
  | "cancel"
  /** Another gesture claimed the press: a pinch ends a pan. */
  | "superseded"
  /** `enabled` turned off, or the node was destroyed. */
  | "disabled"
  /** The user pressed Escape. */
  | "escape"
  /** An element inside the node captured the pointer, or `cancel()` ran. */
  | "claimed";

/** What every gesture handler receives. */
export interface GestureEvent {
  type: "tap" | "doubletap" | "longpress" | "pan" | "pinch" | "swipe";
  /** `"pointer"` for pointers; a pinch can also come from `"wheel"` or Safari's `"gesture"` events. */
  source: "pointer" | "wheel" | "gesture";
  pointerId: number;
  pointerType: string;
  /** The pointer's position, or the midpoint of a pinch. */
  clientX: number;
  clientY: number;
  /** Where the press began (a pan's start is the press point). */
  startX: number;
  startY: number;
  /** `clientX - startX`. */
  deltaX: number;
  deltaY: number;
  /** Pixels per millisecond at release, for `pan` and `swipe`. */
  velocityX?: number;
  velocityY?: number;
  /** Pinch: the span relative to the start (1 at the start). */
  scale?: number;
  /** Pinch: the scale since the previous event, for zooming about a point. */
  deltaScale?: number;
  /** Pinch: radians turned since the start. */
  rotation?: number;
  /** Pinch: radians turned since the previous event. */
  deltaRotation?: number;
  /** Swipe: the physical direction. Swap left and right yourself under `dir="rtl"`. */
  direction?: "left" | "right" | "up" | "down";
  /** The end of a pan, pinch or long press: whether it was aborted. */
  cancelled?: boolean;
  reason?: GestureEndReason;
  timeStamp: number;
  /** The latest pointer event behind this one. */
  originalEvent?: Event;
  /** The `pointerdown` that began the press, to hand to a drag engine. */
  startEvent?: PointerEvent;
}

export type GestureHandler = (event: GestureEvent) => void;

export interface TapOptions {
  /** Called when a press is released without moving or holding. */
  onTap?: GestureHandler;
  /** Movement in pixels that still counts as a tap. @default 10 */
  tolerance?: number;
  /** The longest press, in milliseconds, that still counts as a tap. @default 500 */
  maxDuration?: number;
}

export interface DoubleTapOptions {
  onDoubleTap?: GestureHandler;
  /** The longest gap between taps, in milliseconds. A `tap` handler waits this long. @default 300 */
  interval?: number;
  /** The farthest apart the taps can land, in pixels. @default 30 */
  distance?: number;
}

export interface LongPressOptions {
  /** Called once when the press has been held for `delay` without moving. */
  onLongPress?: GestureHandler;
  /** Called when a long press that fired is released or cancelled. */
  onEnd?: GestureHandler;
  /** Hold time in milliseconds. @default 500 */
  delay?: number;
  /** Movement in pixels that still counts as holding still. @default 10 */
  tolerance?: number;
}

export interface PanOptions {
  /** Called when the press moves past the threshold and the pan claims it. */
  onStart?: GestureHandler;
  onMove?: GestureHandler;
  /** Called on release (with velocity) or when the pan is cancelled. */
  onEnd?: GestureHandler;
  /** `"x"` pans only horizontally and leaves vertical scrolling to the page. @default "both" */
  axis?: "x" | "y" | "both";
  /** Pixels a mouse or pen moves before a pan starts. @default 4 */
  threshold?: number;
  /** Pixels a finger moves before a pan starts. @default 8 */
  touchThreshold?: number;
  /**
   * `"afterLongPress"` makes a finger pan only after a long press, so a
   * swipe on the node still scrolls the page. The pan starts on the first
   * movement after the hold. Needs `longPress`.
   * @default "immediate"
   */
  touch?: "immediate" | "afterLongPress";
}

export interface PinchOptions {
  onStart?: GestureHandler;
  onChange?: GestureHandler;
  onEnd?: GestureHandler;
  /** Pixels the fingers spread or travel before the pinch starts. @default 4 */
  threshold?: number;
  /** Treat Ctrl+wheel and Safari's trackpad `gesture*` events as a pinch. @default true */
  wheel?: boolean;
}

export interface SwipeOptions {
  /** Called on release when the press was a quick flick along `axis`. */
  onSwipe?: GestureHandler;
  /** @default "x" */
  axis?: "x" | "y" | "both";
  /** Pixels the press must travel. @default 30 */
  minDistance?: number;
  /** Pixels per millisecond at release. @default 0.3 */
  minVelocity?: number;
}

/** Params for `gesture`. A function stands for the recognizer's main handler. */
export interface GestureOptions {
  /** Set to `false` to ignore new presses and cancel the one in progress. */
  enabled?: boolean;
  tap?: TapOptions | GestureHandler;
  doubleTap?: DoubleTapOptions | GestureHandler;
  longPress?: LongPressOptions | GestureHandler;
  pan?: PanOptions | GestureHandler;
  pinch?: PinchOptions | GestureHandler;
  swipe?: SwipeOptions | GestureHandler;
  /** Only these pointer types start a press. Default: all. */
  pointerTypes?: Array<"mouse" | "pen" | "touch">;
  /**
   * Presses that start on a descendant matching this selector are left to
   * it. The default covers form controls, links, buttons and
   * `[data-gesture-ignore]`; `""` turns the exclusion off.
   */
  ignore?: string;
  /** Replace the computed `touch-action`, or `false` to leave it alone. */
  touchAction?: string | false;
}

export interface GestureControls {
  update: (options?: GestureOptions) => void;
  destroy: () => void;
  /** End the press in progress as cancelled. */
  cancel: () => void;
}

/**
 * Recognizes tap, double tap, long press, pan, pinch and swipe from Pointer
 * Events, with one arena per press and `touch-action` set from the gestures
 * asked for.
 */
export function createGestures(
  node: HTMLElement,
  options?: GestureOptions,
): GestureControls;

/** The action form of `createGestures`. */
export function gesture(
  node: HTMLElement,
  options?: GestureOptions,
): GestureControls;
