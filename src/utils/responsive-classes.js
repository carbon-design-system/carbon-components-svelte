// @ts-check

/** @typedef {import("../Breakpoint/breakpoints").BreakpointSize} BreakpointSize */

/**
 * Build class names for a prop that accepts a scalar value or a
 * mobile-first breakpoint object (`{ sm, md, lg, xlg, max }`).
 *
 * Strings emit `<base>-<value>` (`sm` unprefixed, other breakpoints get
 * `<base>-<bp>-<value>`). Booleans map to presence: `true` emits `base`
 * itself (or `<base>-<bp>-<trailing>` at non-`sm` breakpoints); `false` at
 * `sm` emits nothing, since that mirrors the implicit default, while
 * `false` at other breakpoints emits an explicit `un`-prefixed override of
 * the class's trailing word so it can undo a `true` set at a smaller
 * breakpoint.
 * @param {string} base
 * @param {string | boolean | Partial<Record<BreakpointSize, string | boolean>> | undefined} value
 * @param {ReadonlyArray<BreakpointSize>} allowed
 * @returns {string[]}
 */
export function responsiveClasses(base, value, allowed) {
  if (value === undefined || value === null) return [];

  if (typeof value !== "object") {
    if (typeof value === "boolean") {
      return value ? [base] : [];
    }
    return [`${base}-${value}`];
  }

  const lastDash = base.lastIndexOf("-");
  const root = base.slice(0, lastDash + 1);
  const trailing = base.slice(lastDash + 1);

  const classes = [];

  for (const bp of allowed) {
    const bpValue = value[bp];
    if (bpValue === undefined) continue;

    if (typeof bpValue === "boolean") {
      if (bp === "sm") {
        if (bpValue) classes.push(base);
      } else {
        classes.push(`${root}${bp}-${bpValue ? trailing : `un${trailing}`}`);
      }
    } else {
      classes.push(
        bp === "sm" ? `${base}-${bpValue}` : `${base}-${bp}-${bpValue}`,
      );
    }
  }

  return classes;
}
