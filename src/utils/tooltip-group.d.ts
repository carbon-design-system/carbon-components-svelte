import type { Writable } from "svelte/store";

export interface TooltipGroupScope {
  /** `Date.now()` of the last release by a tooltip in this scope. */
  releasedAt: number;
}

export interface TooltipGroup {
  /**
   * Tooltips hand off to each other only within the same scope.
   * Nested groups share their parent's scope.
   */
  scope: TooltipGroupScope;
  enterDelayMs: () => number;
  /**
   * The leave delay set on this group or an enclosing one. `undefined`
   * leaves the default to each tooltip.
   */
  leaveDelayMs: () => number | undefined;
  skipDelayMs: () => number;
}

export interface TooltipToken {
  scope: TooltipGroupScope;
}

/** The tooltip currently shown, page-wide. `null` means none is claimed. */
export const activeTooltip: Writable<TooltipToken | null>;

/** Group for tooltips outside any `TooltipGroup`. */
export const rootTooltipGroup: TooltipGroup;

interface TooltipGroupOptions {
  enterDelayMs?: () => number | undefined;
  leaveDelayMs?: () => number | undefined;
  skipDelayMs?: () => number | undefined;
}

/**
 * Create a tooltip group. A group nested in another (non-root) group joins
 * its scope; otherwise it starts a new one. Unset delays fall back to the
 * parent's.
 */
export function createTooltipGroup(
  options?: TooltipGroupOptions & { parent?: TooltipGroup },
): TooltipGroup;

/** Read the nearest tooltip group from context, or the root group. */
export function getTooltipGroup(): TooltipGroup;

/** Create a tooltip group under the nearest one and provide it to descendants. */
export function provideTooltipGroup(
  options?: TooltipGroupOptions,
): TooltipGroup;
