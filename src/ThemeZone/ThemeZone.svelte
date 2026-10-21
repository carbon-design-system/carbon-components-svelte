<script>
  /**
   * @template {keyof HTMLElementTagNameMap} [Tag="div"]
   * @slot {{}}
   */

  /**
   * ThemeZone renders its content in another Carbon theme, such as a Gray
   * 100 sidebar in a White app. It paints the theme's background and text
   * color, and the components inside take the theme's tokens. Zones nest.
   * Only works with `carbon-components-svelte/css/all.css`.
   *
   * Content that a component portals out of the zone, such as a
   * `portalMenu` or a tooltip, keeps the zone's theme.
   *
   * @example
   * ```svelte
   * <ThemeZone theme="g100">
   *   <TextInput labelText="On Gray 100" />
   * </ThemeZone>
   * ```
   */

  /**
   * Specify the theme for the zone. `"system"` follows the operating
   * system color scheme with CSS alone: White for light, Gray 100 for dark.
   * @type {import("../Theme/Theme.svelte").CarbonTheme | "system"}
   */
  export let theme;

  /**
   * Specify the tag name.
   * @type {Tag}
   */
  export let tag = "div";

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { readable, readonly, writable } from "svelte/store";
  import { THEME_ZONE_CONTEXT_KEY } from "../constants/context-keys.js";
  import { themeZoneClasses } from "./theme-zone.js";

  const zone = writable(theme);

  $: zone.set(theme);

  setContext(THEME_ZONE_CONTEXT_KEY, readonly(zone));

  // Like Carbon React's Theme, a zone starts a new layer stack: its surface
  // is the page surface, so a Layer inside it is level 1.
  setContext("carbon:Layer", readable(1));
</script>

<svelte:element
  this={tag}
  bind:this={ref}
  {...$$restProps}
  class={[$$restProps.class, "bx--theme-zone", themeZoneClasses[theme]]
    .filter(Boolean)
    .join(" ")}
>
  <slot />
</svelte:element>
