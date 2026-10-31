// @ts-check

/**
 * The square size of an icon-only button, and of the "More" trigger, per
 * bar size, in pixels.
 */
export const ACTION_BAR_SIZE_PX = Object.freeze({
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
});

/**
 * `Button` size for a bar size. `Button`'s own names are offset from the
 * v11 scale: its "default" is 48px and its "lg" is 64px.
 */
export const BUTTON_SIZE_BY_ACTION_BAR_SIZE = Object.freeze({
  xs: "xs",
  sm: "small",
  md: "field",
  lg: "default",
});

/**
 * Room a collapsed button needs beyond its own size to come back out of the
 * "More" menu, in pixels. The bar collapses at one width and expands at a
 * larger one, so a width near the boundary does not toggle it.
 */
export const ACTION_BAR_EXPAND_SLACK_PX = 16;

/**
 * The least width of a field in an `ActionBarItem`, in rem, while any
 * button shows. Fields shrink to it before a button collapses into the
 * "More" menu. Matches `min-inline-size` on `.bx--action-bar__item`.
 */
export const ACTION_BAR_FIELD_MIN_REM = 8;

/**
 * `Form` size for a bar size, which fields in an `ActionBarItem` take when
 * their own `size` is unset, so they fill the bar's height.
 */
export const FORM_SIZE_BY_ACTION_BAR_SIZE = Object.freeze({
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "xl",
});
