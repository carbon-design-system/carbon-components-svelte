<script>
  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Obtain a reference to the HTML element */
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

  import FloatingPortal from "../Portal/FloatingPortal.svelte";
</script>

{#if portal}
  <FloatingPortal {anchor} {direction} {open}>
    <div
      bind:this={ref}
      role="listbox"
      id="menu-{id}"
      class:bx--list-box__menu={true}
      style="position: static; {$$restProps.style || ''}"
      {...$$restProps}
      on:scroll
    >
      <slot />
    </div>
  </FloatingPortal>
{:else}
  <div
    bind:this={ref}
    role="listbox"
    id="menu-{id}"
    class:bx--list-box__menu={true}
    {...$$restProps}
    on:scroll
  >
    <slot />
  </div>
{/if}
