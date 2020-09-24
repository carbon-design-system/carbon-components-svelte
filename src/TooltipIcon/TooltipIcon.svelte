<script>
  /**
   * Specify the tooltip text
   * @type {string} [tooltipText=""]
   */
  export let tooltipText = "";

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"start" | "center" | "end"} [align="center"]
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the icon
   * @type {"top" | "right" | "bottom" | "left"} [direction="bottom"]
   */
  export let direction = "bottom";

  /**
   * Set an id for the span element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the button HTML element
   * @type {null | HTMLButtonElement} [ref=null]
   */
  export let ref = null;

  $: hidden = false;
</script>

<svelte:body
  on:keydown="{({ key }) => {
    if (key === 'Escape') {
      hidden = true;
    }
  }}" />

<button
  bind:this="{ref}"
  aria-describedby="{id}"
  class:bx--tooltip__trigger="{true}"
  class:bx--tooltip--a11y="{true}"
  class:bx--tooltip--hidden="{hidden}"
  {...$$restProps}
  class="{direction && `bx--tooltip--${direction}`}
    {align && `bx--tooltip--align-${align}`}
    {$$restProps.class}"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseenter="{() => {
    hidden = false;
  }}"
  on:mouseleave
  on:focus
  on:focus="{() => {
    hidden = false;
  }}"
>
  <span id="{id}" class:bx--assistive-text="{true}">{tooltipText}</span>
  <slot />
</button>
