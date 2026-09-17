import type { BreakpointSize } from "../Breakpoint/breakpoints";

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
 */
export function responsiveClasses(
  base: string,
  value:
    | string
    | boolean
    | Partial<Record<BreakpointSize, string | boolean>>
    | undefined,
  allowed: ReadonlyArray<BreakpointSize>,
): string[];
