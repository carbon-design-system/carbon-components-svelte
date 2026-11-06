import type {
  DoubleTapOptions,
  GestureEndReason,
  GestureOptions,
  LongPressOptions,
  PanOptions,
  PinchOptions,
  SwipeOptions,
  TapOptions,
} from "./gesture.js";

export const DEFAULT_IGNORE: string;

/** The options with every recognizer's defaults filled in. */
export interface GestureConfig {
  enabled: boolean;
  pointerTypes: Array<"mouse" | "pen" | "touch"> | null;
  ignore: string;
  touchAction: string | false | undefined;
  tap:
    | (Required<Pick<TapOptions, "tolerance" | "maxDuration">> & TapOptions)
    | null;
  doubleTap:
    | (Required<Pick<DoubleTapOptions, "interval" | "distance">> &
        DoubleTapOptions)
    | null;
  longPress:
    | (Required<Pick<LongPressOptions, "delay" | "tolerance">> &
        LongPressOptions)
    | null;
  pan:
    | (Required<
        Pick<PanOptions, "axis" | "threshold" | "touchThreshold" | "touch">
      > &
        PanOptions)
    | null;
  pinch:
    (Required<Pick<PinchOptions, "threshold" | "wheel">> & PinchOptions) | null;
  swipe:
    | (Required<Pick<SwipeOptions, "axis" | "minDistance" | "minVelocity">> &
        SwipeOptions)
    | null;
}

export function normalizeOptions(options?: GestureOptions): GestureConfig;

export interface PointerInput {
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;
  time: number;
  button?: number;
  event?: PointerEvent;
}

export interface ArenaHost {
  setTimer: (callback: () => void, ms: number) => unknown;
  clearTimer: (id: unknown) => void;
  capture: (pointerId: number) => void;
  lockScroll: (locked: boolean) => void;
  suppressClick: () => void;
}

export function createArena(
  getConfig: () => GestureConfig,
  host: ArenaHost,
): {
  down: (p: PointerInput) => boolean;
  move: (p: PointerInput) => void;
  up: (p: PointerInput) => void;
  cancel: (reason?: GestureEndReason) => void;
  destroy: () => void;
  readonly active: boolean;
  readonly claimed: boolean;
  has: (pointerId: number) => boolean;
  readonly pointerCount: number;
};

export function createExternalPinch(getConfig: () => GestureConfig): {
  change: (
    source: "wheel" | "gesture",
    input: {
      factor?: number;
      scale?: number;
      rotation?: number;
      clientX: number;
      clientY: number;
      event?: Event;
    },
  ) => void;
  end: (options?: { cancelled?: boolean }) => void;
  readonly active: boolean;
};
