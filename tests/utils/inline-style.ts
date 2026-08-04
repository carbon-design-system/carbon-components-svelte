/**
 * Asserts inline style values exactly as they were authored.
 *
 * Prefer this over `toHaveStyle` when the expected value uses a relative unit
 * such as `rem` or `ch`. `toHaveStyle` compares computed styles, and jsdom 30+
 * resolves relative lengths to `px` (`3rem` becomes `48px`, `42ch` becomes
 * `336px`), so an authored value can never match.
 */
export function expectInlineStyle(
  element: Element | null,
  styles: Record<string, string>,
) {
  expect(element).toBeInstanceOf(HTMLElement);

  const { style } = element as HTMLElement;
  const actual: Record<string, string> = {};

  for (const property of Object.keys(styles)) {
    const cssProperty = property.replace(
      /[A-Z]/g,
      (char) => `-${char.toLowerCase()}`,
    );
    actual[property] = style.getPropertyValue(cssProperty);
  }

  expect(actual).toEqual(styles);
}
