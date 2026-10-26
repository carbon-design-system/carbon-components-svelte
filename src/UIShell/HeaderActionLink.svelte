<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /** Set to `true` to use the active state */
  export let linkIsActive = false;

  /**
   * Specify the `href` attribute.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   * @type {null | HTMLAnchorElement}
   */
  export let ref = null;

  import { resolveLinkRel } from "../utils/link-rel.js";
</script>

<a
  bind:this={ref}
  class:bx--header__action={true}
  class:bx--header__action--active={linkIsActive}
  {href}
  rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
  {...$$restProps}
  on:click
>
  <slot name="icon"><svelte:component this={icon} size={20} /></slot>
</a>
