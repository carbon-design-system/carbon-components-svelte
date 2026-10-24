/** Returns the first AI label rendered inside a container. */
export function aiLabel(root: ParentNode) {
  return root.querySelector(".bx--ai-label");
}

/**
 * Each host in `AILabel.surface.test.svelte`: its test id, the element that
 * carries the AI surface, and the surface class.
 */
export const surfaceHosts = [
  ["tile", ".bx--tile", "bx--tile--ai-label"],
  ["clickable-tile", ".bx--tile", "bx--tile--ai-label"],
  ["selectable-tile", ".bx--tile", "bx--tile--ai-label"],
  ["radio-tile", ".bx--tile", "bx--tile--ai-label"],
  ["expandable-tile", ".bx--tile", "bx--tile--ai-label"],
  [
    "text-input",
    ".bx--text-input__field-wrapper",
    "bx--text-input__field-wrapper--ai-label",
  ],
  ["text-area", ".bx--text-area__wrapper", "bx--text-area__wrapper--ai-label"],
  [
    "number-input",
    ".bx--number__input-wrapper",
    "bx--number__input-wrapper--ai-label",
  ],
  [
    "select",
    ".bx--select-input__wrapper",
    "bx--select-input__wrapper--ai-label",
  ],
  [
    "inline-select",
    ".bx--select-input__wrapper",
    "bx--select-input__wrapper--ai-label",
  ],
  [
    "date-picker",
    ".bx--date-picker-input__wrapper",
    "bx--date-picker-input__wrapper--ai-label",
  ],
  ["dropdown", ".bx--list-box", "bx--list-box--ai-label"],
  ["combo-box", ".bx--list-box", "bx--list-box--ai-label"],
  ["multi-select", ".bx--list-box", "bx--list-box--ai-label"],
  ["table-header", "th", "bx--table-header--ai-label"],
  ["sortable-table-header", "th", "bx--table-header--ai-label"],
  ["modal", ".bx--modal", "bx--modal--ai-label"],
  ["composed-modal", ".bx--modal", "bx--modal--ai-label"],
] as const;
