<script>
  /**
   * @restProps {span}
   */

  /**
   * Specify the color of the swatch. Ignored when `colorKey` is set.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray"}
   */
  export let color = "blue";

  /**
   * Pick the color from a string: the same string always gives the same
   * color, and matches `getAvatarBackgroundColor` and `UserAvatar`
   * `backgroundColor="auto"`. Wins over `color`. Use it for categories,
   * not for severity.
   * @type {string | undefined}
   */
  export let colorKey = undefined;

  /**
   * Specify any CSS color to paint the swatch with, instead of the palette.
   * Sets the `--ccs-swatch-color` custom property.
   * @type {string | undefined}
   */
  export let cssColor = undefined;

  /**
   * Specify the size of the swatch: 8px or 12px.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Name the swatch for assistive technologies. Leave empty when the text
   * next to it already names the category, which hides the swatch.
   */
  export let label = "";

  import { getAvatarBackgroundColor } from "../utils/avatar-color.js";

  $: resolvedColor = colorKey ? getAvatarBackgroundColor(colorKey) : color;
</script>

<span
  role={label ? "img" : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : "true"}
  class:bx--swatch={true}
  class:bx--swatch--sm={size === "sm"}
  class:bx--swatch--red={resolvedColor === "red"}
  class:bx--swatch--magenta={resolvedColor === "magenta"}
  class:bx--swatch--purple={resolvedColor === "purple"}
  class:bx--swatch--blue={resolvedColor === "blue"}
  class:bx--swatch--cyan={resolvedColor === "cyan"}
  class:bx--swatch--teal={resolvedColor === "teal"}
  class:bx--swatch--green={resolvedColor === "green"}
  class:bx--swatch--gray={resolvedColor === "gray"}
  style:--ccs-swatch-color={cssColor}
  {...$$restProps}
></span>
