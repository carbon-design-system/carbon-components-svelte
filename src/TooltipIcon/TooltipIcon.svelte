<script>
  /**
   * @generics {Icon = any} Icon
   * @event {null} open
   * @event {null} close
   */

  import { createEventDispatcher, onMount } from "svelte";
  import { get } from "svelte/store";
  import { activeTooltipIcon } from "./tooltip-icon-store.js";

  /**
   * Specify the tooltip text.
   * Alternatively, use the "tooltipText" slot.
   */
  export let tooltipText = "";

  /**
   * Set to `true` to open the tooltip.
   */
  export let open = false;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify the icon size.
   * Carbon icons use a 16/20/24/32 scale, but any number (pixels) can be used.
   * @type {(16 | 20 | 24 | 32 | (number & {}))}
   */
  export let size = 16;

  /** Set to `true` to disable the tooltip icon */
  export let disabled = false;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the icon.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /** Set an id for the span element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  const dispatch = createEventDispatcher();
  const tooltipId = {};

  let isInitialRender = true;
  let clicked = false;

  const show = () => {
    open = true;
    activeTooltipIcon.set(tooltipId);
  };

  const hide = () => {
    clicked = false;
    open = false;
    if (get(activeTooltipIcon) === tooltipId) {
      activeTooltipIcon.set(null);
    }
  };

  $: tooltipHidden =
    $activeTooltipIcon !== null && $activeTooltipIcon !== tooltipId;

  // Sync the store when open is set externally (e.g., bind:open).
  $: {
    if (open) {
      activeTooltipIcon.set(tooltipId);
    } else if (get(activeTooltipIcon) === tooltipId) {
      activeTooltipIcon.set(null);
    }
  }

  $: {
    if (!isInitialRender) {
      dispatch(open ? "open" : "close");
    }
    isInitialRender = false;
  }

  onMount(() => {
    return () => {
      if (get(activeTooltipIcon) === tooltipId) {
        activeTooltipIcon.set(null);
      }
    };
  });
</script>

<svelte:window
  on:keydown={({ key }) => {
    if (key === "Escape") {
      hide();
    }
  }}
/>

<button
  bind:this={ref}
  {disabled}
  type="button"
  aria-describedby={id}
  class:bx--tooltip__trigger={true}
  class:bx--tooltip--a11y={true}
  class:bx--tooltip--visible={open && !disabled && !tooltipHidden}
  class:bx--tooltip--hidden={!open || disabled || tooltipHidden}
  class:bx--tooltip--top={direction === "top"}
  class:bx--tooltip--right={direction === "right"}
  class:bx--tooltip--bottom={direction === "bottom"}
  class:bx--tooltip--left={direction === "left"}
  class:bx--tooltip--align-start={align === "start"}
  class:bx--tooltip--align-center={align === "center"}
  class:bx--tooltip--align-end={align === "end"}
  style:cursor={disabled ? "not-allowed" : "default"}
  {...$$restProps}
  on:click
  on:click={() => {
    if (disabled) return;
    if (clicked) {
      hide();
    } else {
      clicked = true;
      show();
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseenter={() => {
    if (disabled) return;
    show();
  }}
  on:mouseleave
  on:mouseleave={() => {
    if (clicked) return;
    hide();
  }}
  on:focus
  on:focus={() => {
    if (disabled) return;
    show();
  }}
  on:blur
  on:blur={() => {
    hide();
  }}
>
  <span {id} class:bx--assistive-text={true} style:pointer-events="none">
    <slot name="tooltipText">{tooltipText}</slot>
  </span>
  <slot> <svelte:component this={icon} {size} /> </slot>
</button>
