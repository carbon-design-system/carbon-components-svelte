/** The square size of a button, and of the "More" trigger, in pixels. */
export const ACTION_BAR_SIZE_PX: Readonly<
  Record<"xs" | "sm" | "md" | "lg", number>
>;

/** `Button` size for a bar size. */
export const BUTTON_SIZE_BY_ACTION_BAR_SIZE: Readonly<{
  xs: "xs";
  sm: "small";
  md: "field";
  lg: "default";
}>;

/** Room a collapsed button needs beyond its own size to come back, in pixels. */
export const ACTION_BAR_EXPAND_SLACK_PX: number;

/** `Form` size for a bar size: fields in an item take it. */
export const FORM_SIZE_BY_ACTION_BAR_SIZE: Readonly<{
  xs: "xs";
  sm: "sm";
  md: "md";
  lg: "xl";
}>;
