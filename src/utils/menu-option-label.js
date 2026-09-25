// @ts-check

/**
 * Read a menu option's accessible label text: its
 * `.bx--menu-option__label` child if present, else the element's own
 * text content, trimmed.
 *
 * @param {HTMLElement} item
 * @returns {string}
 */
export function menuOptionLabel(item) {
  return (
    item.querySelector(".bx--menu-option__label")?.textContent ??
    item.textContent ??
    ""
  ).trim();
}
