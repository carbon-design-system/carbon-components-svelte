/**
 * Native `<dialog>` / `[popover]` ancestors used when portalling the flatpickr
 * calendar with `portalMenu` so it participates in the correct top layer.
 */
export const TOP_LAYER_ANCESTOR_SELECTOR = "dialog,[popover]";

/**
 * @param {HTMLElement | null | undefined} root
 * @returns {HTMLElement | null}
 */
export function getTopLayerAncestor(root) {
  return root?.closest(TOP_LAYER_ANCESTOR_SELECTOR) ?? null;
}

/**
 * Flatpickr `position` hook: `position: fixed` with viewport-relative coordinates.
 * Used when the calendar is appended into a top-layer ancestor — `position: absolute`
 * would resolve against that element’s containing block and mis-place the calendar.
 *
 * @param {import("./datePickerTopLayer").FlatpickrTopLayerPositionInstance} instance
 * @param {HTMLElement | undefined} customPositionElement
 */
export function positionFlatpickrCalendarFixed(
  instance,
  customPositionElement,
) {
  const positionElement =
    customPositionElement || instance._positionElement || instance._input;
  const calendarContainer = instance.calendarContainer;
  if (!calendarContainer || !positionElement) return;

  const calendarHeight = Array.prototype.reduce.call(
    calendarContainer.children,
    (/** @type {number} */ acc, /** @type {HTMLElement} */ child) =>
      acc + child.offsetHeight,
    0,
  );
  const calendarWidth = calendarContainer.offsetWidth;
  const inputBounds = positionElement.getBoundingClientRect();
  const distanceFromBottom = window.innerHeight - inputBounds.bottom;
  const showOnTop =
    distanceFromBottom < calendarHeight && inputBounds.top > calendarHeight;

  const top =
    inputBounds.top +
    (showOnTop ? -calendarHeight - 2 : positionElement.offsetHeight + 2);
  const left = inputBounds.left;
  const rightMost = left + calendarWidth > window.innerWidth;

  calendarContainer.classList.toggle("arrowTop", !showOnTop);
  calendarContainer.classList.toggle("arrowBottom", showOnTop);
  calendarContainer.classList.toggle("arrowLeft", !rightMost);
  calendarContainer.classList.toggle("arrowRight", rightMost);
  calendarContainer.classList.toggle("arrowCenter", false);
  calendarContainer.classList.toggle("rightMost", rightMost);

  calendarContainer.style.position = "fixed";
  calendarContainer.style.top = `${top}px`;
  if (rightMost) {
    calendarContainer.style.left = "auto";
    calendarContainer.style.right = `${window.innerWidth - inputBounds.right}px`;
  } else {
    calendarContainer.style.left = `${left}px`;
    calendarContainer.style.right = "auto";
  }
}

/**
 * Whether a click/focus event target is still “inside” the date picker UI when
 * the calendar is portalled into a top-layer ancestor — including the subtree
 * of that ancestor so brief hit-testing quirks during open animations do not
 * close the calendar.
 *
 * @param {HTMLElement | null | undefined} datePickerRef
 * @param {HTMLElement} calendarContainer
 * @param {EventTarget | null} target
 */
export function isEventTargetInsidePortaledCalendar(
  datePickerRef,
  calendarContainer,
  target,
) {
  if (!(target instanceof Node)) return false;
  if (datePickerRef?.contains(target)) return true;
  if (calendarContainer.contains(target)) return true;
  const topLayer = getTopLayerAncestor(datePickerRef);
  return !!topLayer?.contains(target);
}
