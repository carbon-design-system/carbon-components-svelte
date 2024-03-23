<script>
  /**
   * @event {{ target: HTMLElement; }} click:outside
   */

  /** Set an id for the content `span` component */
  export let id = "ccs-" + Math.random().toString(36);

  /** Set to `true` to display the popover */
  export let open = false;

  /** Set to `true` to close the popover on an outside click */
  export let closeOnOutsideClick = false;

  /** Set to `true` render a caret */
  export let caret = false;

  /**
   * Specify the alignment of the caret
   * @type {"top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right" | "left" | "left-bottom" | "left-top" | "right" | "right-bottom" | "right-top"}
   */
  export let align = "top";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Specify whether a drop shadow should be rendered on the popover */
  export let dropShadow = false;

  /** Set to `true` to enable the high contrast variant */
  export let highContrast = false;

  /**
   * Specify the container `div` props
   * @type {import('svelte/elements').HTMLDivAttributes}
   */
  export let containerProps = {};

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let ref = null;
</script>

<svelte:window
  on:click="{(e) => {
    if (!open) return;
    if (!ref.contains(e.target)) {
      dispatch('click:outside', { target: e.target });
      if (closeOnOutsideClick) open = false;
    }
  }}"
/>

<span
  bind:this="{ref}"
  id="{id}"
  class:bx--popover-container="{true}"
  class:bx--popover--caret="{caret}"
  class:bx--popover--drop-shadow="{dropShadow}"
  class:bx--popover--light="{light}"
  class:bx--popover--high-contrast="{highContrast}"
  class:bx--popover--top="{align === 'top'}"
  class:bx--popover--top-left="{align === 'top-left'}"
  class:bx--popover--top-right="{align === 'top-right'}"
  class:bx--popover--bottom="{align === 'bottom'}"
  class:bx--popover--bottom-left="{align === 'bottom-left'}"
  class:bx--popover--bottom-right="{align === 'bottom-right'}"
  class:bx--popover--left="{align === 'left'}"
  class:bx--popover--left-bottom="{align === 'left-bottom'}"
  class:bx--popover--left-top="{align === 'left-top'}"
  class:bx--popover--right="{align === 'right'}"
  class:bx--popover--right-bottom="{align === 'right-bottom'}"
  class:bx--popover--right-top="{align === 'right-top'}"
  class:bx--popover--open="{open}"
  {...containerProps}
>
  <slot />
</span>
