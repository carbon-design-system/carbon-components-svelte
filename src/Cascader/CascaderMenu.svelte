<script>
  /**
   * Internal. The surface of a `Cascader` menu, in place or in a portal.
   * @restProps {div}
   */

  /**
   * Obtain a reference to the menu element.
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /** Set to `true` to render the menu in a portal. */
  export let portal = false;

  /** Set to `true` to open the portal. */
  export let open = false;

  /**
   * The element the portal lines up with.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * One column at a time, with a way back, instead of side-by-side columns.
   */
  export let drill = false;

  /**
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` when the menu holds checkboxes. */
  export let multiple = false;

  import FloatingPortal from "../Portal/FloatingPortal.svelte";
</script>

{#if portal}
  <FloatingPortal
    {anchor}
    {direction}
    {open}
    intrinsicWidth={!drill}
    intrinsicAlign="start"
  >
    <div
      bind:this={ref}
      class:bx--cascader__menu={true}
      class:bx--cascader__menu--portal={true}
      class:bx--cascader__menu--drill={drill}
      class:bx--cascader__menu--xs={size === "xs"}
      class:bx--cascader__menu--sm={size === "sm"}
      class:bx--cascader__menu--lg={size === "lg" || size === "xl"}
      class:bx--multi-select={multiple}
      {...$$restProps}
      on:mousedown|preventDefault
    >
      <slot />
    </div>
  </FloatingPortal>
{:else}
  <div
    bind:this={ref}
    class:bx--cascader__menu={true}
    class:bx--cascader__menu--drill={drill}
    class:bx--cascader__menu--up={direction === "top"}
    class:bx--cascader__menu--xs={size === "xs"}
    class:bx--cascader__menu--sm={size === "sm"}
    class:bx--cascader__menu--lg={size === "lg" || size === "xl"}
    class:bx--multi-select={multiple}
    {...$$restProps}
    on:mousedown|preventDefault
  >
    <slot />
  </div>
{/if}
