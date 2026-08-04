<script>
  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set to `true` to render the menu in a portal,
   * allowing it to escape containers with `overflow: hidden`.
   * @type {boolean}
   */
  export let portal = false;

  /**
   * Set to `true` to open the floating portal.
   * Only used when `portal` is `true`.
   * @type {boolean}
   */
  export let open = false;

  /**
   * Specify the anchor element to position the portal relative to.
   * Only used when `portal` is `true`.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Specify the direction of the menu.
   * Only used when `portal` is `true`.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Class applied to a wrapper element inside the portal.
   * Only used when `portal` is `true`.
   * @type {string}
   */
  export let portalHostClass = undefined;

  /**
   * Specify the maximum height of the menu.
   * A number is treated as pixels; a string is used as a CSS length.
   * The menu scrolls once its items exceed the height.
   * @type {number | string}
   */
  export let maxHeight = undefined;

  import FloatingPortal from "../Portal/FloatingPortal.svelte";

  $: maxHeightStyle =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
  $: maxHeightCss = maxHeightStyle ? `max-height: ${maxHeightStyle};` : "";
</script>

{#if portal}
  <FloatingPortal {anchor} {direction} {open}>
    <div class={portalHostClass}>
      <div
        bind:this={ref}
        {...$$restProps}
        role="listbox"
        id="menu-{id}"
        class:bx--list-box__menu={true}
        style="position: static; {maxHeightCss} {$$restProps.style || ''}"
        on:scroll
        on:mouseleave
      >
        <slot />
      </div>
    </div>
  </FloatingPortal>
{:else}
  <div
    bind:this={ref}
    {...$$restProps}
    role="listbox"
    id="menu-{id}"
    class:bx--list-box__menu={true}
    style="{maxHeightCss} {$$restProps.style || ''}"
    on:scroll
    on:mouseleave
  >
    <slot />
  </div>
{/if}
