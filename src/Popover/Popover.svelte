<script>
  /**
   * @event {{ target: HTMLElement; }} click:outside
   */

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

  /** Set to `true` to enable the high contrast variant */
  export let highContrast = false;

  /** Set to `true` to use a relative position */
  export let relative = false;

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

<div
  bind:this="{ref}"
  class:cds--popover-container="{true}"
  class:cds--popover--caret="{caret}"
  class:cds--popover--light="{light}"
  class:cds--popover--high-contrast="{highContrast}"
  class:cds--popover--top="{align === 'top'}"
  class:cds--popover--top-left="{align === 'top-left'}"
  class:cds--popover--top-right="{align === 'top-right'}"
  class:cds--popover--bottom="{align === 'bottom'}"
  class:cds--popover--bottom-left="{align === 'bottom-left'}"
  class:cds--popover--bottom-right="{align === 'bottom-right'}"
  class:cds--popover--left="{align === 'left'}"
  class:cds--popover--left-bottom="{align === 'left-bottom'}"
  class:cds--popover--left-top="{align === 'left-top'}"
  class:cds--popover--right="{align === 'right'}"
  class:cds--popover--right-bottom="{align === 'right-bottom'}"
  class:cds--popover--right-top="{align === 'right-top'}"
  class:cds--popover--open="{open}"
  class:cds--popover--relative="{relative}"
  style:position="{relative ? "relative" : undefined}"
  {...$$restProps}
>
  <slot />
</div>
