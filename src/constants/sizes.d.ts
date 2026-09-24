/**
 * `Button` size for the trigger of a `MenuButton` or `ComboButton`
 * with the given menu size.
 *
 * Button's "default"/"lg" naming is offset from the v11 size scale:
 * unclassed "default" renders at 48px (v11 "lg"), while Button's "lg"
 * class renders at 64px with baseline-aligned text (v11 "xl"/"2xl").
 * The map never picks Button's "lg"/"xl" classes. "xs" has no Button
 * equivalent; the menu-button and combo-button styles shrink it.
 */
export const BUTTON_SIZE_BY_MENU_SIZE: Readonly<{
  xs: "small";
  sm: "small";
  md: "field";
  lg: "default";
}>;

/**
 * `MenuButton` size for a toolbar action. The icon-only trigger sizes
 * to the Toolbar's CSS-driven width (24/32/48px for xs/sm/default), not
 * to its own "md" (40px) default, so pass the matching size to line the
 * menu's seam-hiding bridge up with the rendered trigger.
 */
export const MENU_SIZE_BY_TOOLBAR_SIZE: Readonly<{
  xs: "xs";
  sm: "sm";
  default: "lg";
}>;
