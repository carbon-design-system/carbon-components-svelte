/**
 * Minimal flatpickr instance shape for {@link positionFlatpickrCalendarFixed}.
 */
export interface FlatpickrTopLayerPositionInstance {
  calendarContainer: HTMLElement;
  _positionElement?: HTMLElement;
  _input?: HTMLInputElement;
}

export declare const TOP_LAYER_ANCESTOR_SELECTOR: "dialog,[popover]";

export function getTopLayerAncestor(
  root: HTMLElement | null | undefined,
): HTMLElement | null;

export function positionFlatpickrCalendarFixed(
  instance: FlatpickrTopLayerPositionInstance,
  customPositionElement?: HTMLElement,
): void;

export function isEventTargetInsidePortaledCalendar(
  datePickerRef: HTMLElement | null | undefined,
  calendarContainer: HTMLElement,
  target: EventTarget | null,
): boolean;
