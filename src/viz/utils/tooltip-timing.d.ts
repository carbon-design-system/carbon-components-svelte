import type { Readable } from "svelte/store";

export type TooltipTiming = {
  /** Whether the tooltip may show now. */
  shown: Readable<boolean>;
  /**
   * Report the hovered item, or a nullish value when none. A pointer hover
   * shows after the delay, a keyboard one at once, and a shown tooltip
   * follows without delay.
   */
  settle(current: unknown, origin?: "pointer" | "keyboard" | "sync"): void;
  /** Svelte action that records whether the last input was a pointer or a key. */
  track(node: Element): { destroy(): void };
  /** Cancel a pending show. */
  destroy(): void;
};

/** Shared show timing for hover tooltips. */
export function createTooltipTiming(delay?: number): TooltipTiming;
