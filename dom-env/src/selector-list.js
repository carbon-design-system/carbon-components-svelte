// Shared by the stylesheet parser (css.js) and CSS coverage (coverage.js).

/**
 * Splits a selector list on commas outside parentheses and brackets, so
 * `:is(.a, .b)` stays one selector.
 */
export function splitSelectors(text) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out.filter(Boolean);
}
