const INLINE_TOOLTIP_CLASSES = (position: string) => [
  "bx--tooltip__trigger",
  "bx--tooltip--a11y",
  `bx--btn--icon-only--${position}`,
  "bx--tooltip--align-center",
];

/** Asserts that an icon-only button has (or lacks) the inline CSS tooltip classes. */
export function expectInlineTooltip(
  el: Element,
  on: boolean,
  position = "bottom",
) {
  for (const className of INLINE_TOOLTIP_CLASSES(position)) {
    if (on) expect(el).toHaveClass(className);
    else expect(el).not.toHaveClass(className);
  }
}
