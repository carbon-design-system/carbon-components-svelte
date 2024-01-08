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
  class:cds--tooltip__trigger="{true}"
  class:cds--tooltip--a11y="{true}"
  class:cds--tooltip--hidden="{hidden || disabled}"
  class:cds--tooltip--top="{direction === 'top'}"
  class:cds--tooltip--right="{direction === 'right'}"
  class:cds--tooltip--bottom="{direction === 'bottom'}"
  class:cds--tooltip--left="{direction === 'left'}"
  class:cds--tooltip--align-start="{align === 'start'}"
  class:cds--tooltip--align-center="{align === 'center'}"
  class:cds--tooltip--align-end="{align === 'end'}"
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
  <span id="{id}" class:cds--assistive-text="{true}">
    <slot name="tooltipText">{tooltipText}</slot>
  </span>
  <slot>
    <svelte:component this="{icon}" />
  </slot>
</button>
