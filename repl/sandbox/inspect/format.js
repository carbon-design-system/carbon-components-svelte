// console format specifiers: %s %d %i %f %o %O %c, as browsers implement them.
// Returns styled text parts (for the first argument) and the leftover args.

const SPECIFIER = /%([sdifoOc%])/g;
const ALLOWED_STYLE = new Set([
  "color",
  "background",
  "background-color",
  "font-weight",
  "font-style",
  "font-size",
  "text-decoration",
  "padding",
  "border-radius",
  "border",
  "margin",
]);
const UNSAFE_VALUE = /url\(|expression\(|@import|javascript:/i;

/**
 * Only plain declarations from an allowlist survive: no url(), no layout
 * properties that could cover the console, no selectors.
 */
export function sanitizeStyle(css) {
  return String(css)
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      const i = decl.indexOf(":");
      if (i < 1) return false;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = decl.slice(i + 1).trim();
      return ALLOWED_STYLE.has(prop) && value && !UNSAFE_VALUE.test(value);
    })
    .join("; ");
}

/**
 * @param {unknown[]} args
 * @param {(value: unknown) => unknown} toPreview - for %o / %O
 * @returns {{ parts: ({ text: string; style?: string } | { value: unknown; style?: string })[] | null; rest: unknown[] }}
 */
export function formatArgs(args, toPreview) {
  if (typeof args[0] !== "string" || !args[0].includes("%"))
    return { parts: null, rest: args };
  const template = args[0];
  let next = 1;
  let style = "";
  let last = 0;
  const parts = [];
  const push = (text) => {
    if (text) parts.push(style ? { text, style } : { text });
  };
  template.replace(SPECIFIER, (match, spec, offset) => {
    push(template.slice(last, offset));
    last = offset + match.length;
    if (spec === "%") {
      push("%");
      return match;
    }
    if (next >= args.length) {
      push(match);
      return match;
    }
    const arg = args[next++];
    switch (spec) {
      case "s":
        push(typeof arg === "string" ? arg : stringify(arg));
        break;
      case "d":
      case "i":
        push(
          typeof arg === "symbol"
            ? "NaN"
            : String(Number.parseInt(/** @type {any} */ (arg), 10)),
        );
        break;
      case "f":
        push(
          typeof arg === "symbol"
            ? "NaN"
            : String(Number.parseFloat(/** @type {any} */ (arg))),
        );
        break;
      case "o":
      case "O":
        parts.push(
          style ? { value: toPreview(arg), style } : { value: toPreview(arg) },
        );
        break;
      case "c":
        style = sanitizeStyle(arg);
        break;
    }
    return match;
  });
  push(template.slice(last));
  return { parts, rest: args.slice(next) };
}

function stringify(value) {
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "bigint") return `${value}n`;
  if (value === null || typeof value !== "object") return String(value);
  try {
    return String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
