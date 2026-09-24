/**
 * Blur a menu trigger after a mouse-driven close. A keyboard-activated
 * click (Enter/Space) reports `event.detail` of `0`; a real mouse click
 * reports `1+`. Blurring only on a mouse-driven close keeps the trigger
 * from lingering with a visible focus ring, while keyboard users still see
 * focus stay put, as they should.
 */
export function blurOnMouseClose(
  wasOpen: boolean,
  event: MouseEvent,
  trigger: { blur: () => void } | null | undefined,
): void;
