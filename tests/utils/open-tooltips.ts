/** Returns every portalled tooltip currently in the document. */
export function openTooltips() {
  return Array.from(document.querySelectorAll(".bx--tooltip-portal__content"));
}
