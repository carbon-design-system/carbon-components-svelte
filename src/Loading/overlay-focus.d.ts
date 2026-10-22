/**
 * Hold focus in a `Loading` overlay while `active` is `true`: move focus in,
 * reclaim Tab and outside focus, and restore focus when loading stops.
 */
export function overlayFocus(
  node: HTMLElement,
  active: boolean,
): { update: (active: boolean) => void; destroy: () => void };
