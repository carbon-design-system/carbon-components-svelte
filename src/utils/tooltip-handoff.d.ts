import type { Writable } from "svelte/store";

export interface TooltipHandoff {
  scheduleEnter: (onShow: () => void) => void;
  scheduleLeave: (onHide: () => void) => void;
  claim: () => void;
  release: () => void;
  cancel: () => void;
}

export interface TooltipHandoffOptions {
  activeTooltip: Writable<unknown>;
  id: unknown;
  enterDelayMs?: number;
  leaveDelayMs?: number;
  emptyValue?: unknown;
}

/** Create hover/focus scheduling for a warm-handoff icon tooltip. */
export function createTooltipHandoff(
  options: TooltipHandoffOptions,
): TooltipHandoff;
