<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @extendProps {"./Tag.svelte"} TagProps
   */

  /**
   * Specify the type of the tag. A neutral gray by default, so the
   * swatch carries the color.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline" | undefined}
   */
  export let type = "gray";

  /**
   * Specify the color of the swatch. Ignored when `colorKey` is set.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray"}
   */
  export let color = "blue";

  /**
   * Pick the swatch color from a string, such as a team name: the same
   * string always gives the same color, as in `getAvatarBackgroundColor`.
   * Wins over `color`.
   * @type {string | undefined}
   */
  export let colorKey = undefined;

  /**
   * Specify any CSS color for the swatch, instead of the palette.
   * @type {string | undefined}
   */
  export let cssColor = undefined;

  /** Set to `false` to hide the swatch */
  export let showSwatch = true;

  import Swatch from "./Swatch.svelte";
  import Tag from "./Tag.svelte";
</script>

<!-- The swatch sits in the `icon` slot, so a `TagSet` measures it with the
tag. A slot can't be passed from inside an `{#if}`, so the two cases are
two tags. The rest of the props, such as `size` and `filter`, go to `Tag`. -->
{#if showSwatch}
  <Tag
    {type}
    {...$$restProps}
    on:click
    on:close
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <Swatch
      slot="icon"
      {color}
      {colorKey}
      {cssColor}
      size={$$restProps.size === "sm" ? "sm" : "md"}
    />
    <slot />
  </Tag>
{:else}
  <Tag
    {type}
    {...$$restProps}
    on:click
    on:close
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </Tag>
{/if}
