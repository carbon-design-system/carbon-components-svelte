/**
 * The calendar fields {@link positionCalendarFixed} reads.
 */
export interface FixedCalendarInstance {
  calendarContainer: HTMLElement;
  _positionElement?: HTMLElement;
  _input?: HTMLInputElement;
  /** Read for the inline start; the computed direction when unset. */
  config?: { rtl?: () => boolean };
}

export declare const TOP_LAYER_ANCESTOR_SELECTOR: "dialog,[popover]";

export function getTopLayerAncestor(
  root: HTMLElement | null | undefined,
): HTMLElement | null;

export function positionCalendarFixed(
  instance: FixedCalendarInstance,
  customPositionElement?: HTMLElement,
): void;
