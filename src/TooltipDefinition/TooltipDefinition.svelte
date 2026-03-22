<script>
  /**
   * @event {null} open
   * @event {null} close
   */

  /** Specify the tooltip text */
  export let tooltipText = "";

  /**
   * Set to `true` to open the tooltip.
   */
  export let open = false;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the icon.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /** Set an id for the tooltip div element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * By default, the tooltip is opened on hover or focus.
   * Set to `true` to open the tooltip on click/focus instead of on hover.
   * Unhovering or blurring the tooltip will close it.
   */
  export let clickToOpen = false;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  /**
   * Set to `true` to render the tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { createEventDispatcher, getContext } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";

  const insideModal = getContext("carbon:Modal");

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  const PORTAL_VERTICAL_GAP_TOP_PX = -2;
  const PORTAL_VERTICAL_GAP_BOTTOM_PX = -3;

  const dispatch = createEventDispatcher();

  const hide = () => (open = false);

  const show = () => (open = true);

  const toggle = () => (open = !open);

  let isInitialRender = true;

  $: {
    if (!isInitialRender) {
      dispatch(open ? "open" : "close");
    }
    isInitialRender = false;
  }
</script>

<svelte:window
  on:keydown={({ key }) => {
    if (key === "Escape") hide();
  }}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  class:bx--tooltip--definition={true}
  class:bx--tooltip--a11y={true}
  {...$$restProps}
  on:mouseenter={clickToOpen ? undefined : show}
  on:mouseleave={hide}
>
  <button
    bind:this={ref}
    type="button"
    aria-describedby={id}
    class:bx--tooltip--portal-active={effectivePortalTooltip}
    class:bx--tooltip--a11y={!effectivePortalTooltip}
    class:bx--tooltip__trigger={true}
    class:bx--tooltip__trigger--definition={true}
    class:bx--tooltip--hidden={!effectivePortalTooltip && !open}
    class:bx--tooltip--visible={!effectivePortalTooltip && open}
    class:bx--tooltip--top={!effectivePortalTooltip && direction === "top"}
    class:bx--tooltip--bottom={!effectivePortalTooltip &&
      direction === "bottom"}
    class:bx--tooltip--align-start={!effectivePortalTooltip &&
      align === "start"}
    class:bx--tooltip--align-center={!effectivePortalTooltip &&
      align === "center"}
    class:bx--tooltip--align-end={!effectivePortalTooltip && align === "end"}
    on:click={clickToOpen ? toggle : undefined}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:focus={clickToOpen ? undefined : show}
    on:blur={hide}
  >
    <slot />
  </button>
  {#if !effectivePortalTooltip}
    <div role="tooltip" {id} class:bx--assistive-text={true}>
      <slot name="tooltip">{tooltipText}</slot>
    </div>
  {/if}
</span>

{#if effectivePortalTooltip}
  <FloatingPortal
    anchor={ref}
    {direction}
    {open}
    gapTop={direction === "top" ? PORTAL_VERTICAL_GAP_TOP_PX : 0}
    gapBottom={direction === "bottom" ? PORTAL_VERTICAL_GAP_BOTTOM_PX : 0}
    intrinsicAlign={align}
    intrinsicWidth={true}
    let:direction={actualDirection}
  >
    <div
      class:bx--tooltip-portal={true}
      data-direction={actualDirection ?? direction}
      data-tooltip-type="definition"
    >
      <span class:bx--tooltip-portal__caret={true}></span>
      <span
        {id}
        role="tooltip"
        class:bx--tooltip-portal__content={true}
        class:bx--assistive-text={true}
      >
        <slot name="tooltip">{tooltipText}</slot>
      </span>
    </div>
  </FloatingPortal>
{/if}
