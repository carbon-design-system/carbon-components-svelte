import type { Readable } from "svelte/store";

export type TooltipTimingOptions = {
  /** Milliseconds a shown tooltip stays after the pointer leaves, so the gap to the next item does not flicker it. Default 100. */
  leaveDelay?: number;
  /** Milliseconds after hiding during which a new pointer hover shows at once. Default 300. */
  warm?: number;
  /** Runs when a press outside the tracked node releases a pin. */
  onUnpin?: () => void;
  /** Runs when the tooltip hides after `leave`, so the chart can clear its hover. */
  onHide?: () => void;
};

export type TooltipTiming = {
  /** Whether the tooltip may show now. */
  shown: Readable<boolean>;
  /** Whether the tooltip is held on its item. */
  pinned: Readable<boolean>;
  /**
   * Report the hovered item, or a nullish value when none. A pointer hover
   * shows after the delay, a keyboard one at once, and a shown tooltip
   * follows without delay. A nullish item hides at once; a pointer that
   * left should call `leave` instead.
   */
  settle(
    current: unknown,
    origin?: "pointer" | "keyboard" | "touch" | "sync",
  ): void;
  /** The pointer is over an item again: cancel a pending hide, then run `fn` unless pinned. */
  enter(fn?: () => void): void;
  /** The pointer left: hide after `leaveDelay` unless an item is hovered again, then run `onHide`. */
  leave(): void;
  /** Hold the tooltip on its current item. */
  pin(): void;
  /** Release a held tooltip. */
  unpin(): void;
  togglePin(): void;
  /** Change the timings after creation. */
  configure(next: { delay?: number; leaveDelay?: number; warm?: number }): void;
  /** Svelte action that records whether the last input was a mouse, a finger, or a key, and releases a pin on a press outside. */
  track(node: Element): { destroy(): void };
  /** Cancel pending timers. */
  destroy(): void;
};

/** Shared timing for hover tooltips. */
export function createTooltipTiming(
  delay?: number,
  options?: TooltipTimingOptions,
): TooltipTiming;
