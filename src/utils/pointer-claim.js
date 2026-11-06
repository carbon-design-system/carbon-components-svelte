// @ts-check

/**
 * Pointer events that an element has taken for itself.
 *
 * A `pointerdown` bubbles from the pressed element out to its ancestors, so
 * an ancestor that recognizes gestures sees every press a descendant has
 * already started to drag. The descendant marks the event here, and the
 * ancestor leaves the press alone. Capturing the pointer does not say this
 * on its own: a touch pointer is captured by the element it pressed whether
 * or not that element wants it.
 *
 * @type {WeakSet<Event>}
 */
const claimed = new WeakSet();

/**
 * Mark `event`, a `pointerdown`, as taken. Call it from the handler that
 * starts a drag on the pressed element.
 *
 * @param {Event} event
 */
export function claimPointer(event) {
  claimed.add(event);
}

/**
 * Whether an element in the event's path has claimed it.
 *
 * @param {Event} event
 * @returns {boolean}
 */
export function isPointerClaimed(event) {
  return claimed.has(event);
}
