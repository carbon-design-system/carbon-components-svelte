import type { Readable } from "svelte/store";

export type TooltipTiming = {
  /** Whether the tooltip may show now. */
  shown: Readable<boolean>;
  /** Whether the tooltip is held on its item. */
  pinned: Readable<boolean>;
  /**
   * Report the hovered item, or a nullish value when none. A pointer hover
   * shows after the delay, a keyboard one at once, and a shown tooltip
   * follows without delay.
   */
  settle(current: unknown, origin?: "pointer" | "keyboard" | "sync"): void;
  /** Svelte action that records whether the last input was a mouse, a finger, or a key, and releases a pin on a press outside. */
  track(node: Element): { destroy(): void };
  /** Cancel a pending show. */
  destroy(): void;
};

/** Shared show timing for hover tooltips. `onUnpin` runs when a press outside the tracked node releases a pin. */
export function createTooltipTiming(
  delay?: number,
  options?: { onUnpin?: () => void },
): TooltipTiming;
