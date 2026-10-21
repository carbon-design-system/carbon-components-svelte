/**
 * Wrap text in a single-quoted CSS string, escaping the quote, backslash and
 * newline characters that would otherwise end the string early or drop the
 * declaration.
 */
export function toCssString(value: string): string;
