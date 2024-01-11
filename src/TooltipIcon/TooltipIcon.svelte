<script>
  /**
   * Specify the tooltip text.
   * Alternatively, use the "tooltipText" slot
   */
  export let tooltipText = "";

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = undefined;

  /** Set to `true` to disable the tooltip icon */
  export let disabled = false;

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the icon
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /** Set an id for the span element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  let hidden = false;
</script>

<svelte:window
  on:keydown="{({ key }) => {
    if (key === 'Escape') {
      hidden = true;
    }
  }}"
/>

<button
  bind:this="{ref}"
  disabled="{disabled}"
  aria-describedby="{id}"
  class:bx--tooltip__trigger="{true}"
  class:bx--tooltip--a11y="{true}"
  class:bx--tooltip--hidden="{hidden || disabled}"
  class:bx--tooltip--top="{direction === 'top'}"
  class:bx--tooltip--right="{direction === 'right'}"
  class:bx--tooltip--bottom="{direction === 'bottom'}"
  class:bx--tooltip--left="{direction === 'left'}"
  class:bx--tooltip--align-start="{align === 'start'}"
  class:bx--tooltip--align-center="{align === 'center'}"
  class:bx--tooltip--align-end="{align === 'end'}"
  style:cursor="{disabled ? "not-allowed" : "default"}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseenter="{() => {
    if (disabled) return;
    hidden = false;
  }}"
  on:mouseleave
  on:focus
  on:focus="{() => {
    if (disabled) return;
    hidden = false;
  }}"
>
  <span id="{id}" class:bx--assistive-text="{true}">
    <slot name="tooltipText">{tooltipText}</slot>
  </span>
  <slot>
    <svelte:component this="{icon}" />
  </slot>
</button>
