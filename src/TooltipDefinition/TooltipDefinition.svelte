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
   * @type {"top" | "bottom"} [direction="bottom"]
   */
  export let direction = "bottom";

  /**
   * Set an id for the tooltip div element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the button HTML element
   * @type {null | HTMLButtonElement} [ref=null]
   */
  export let ref = null;

  $: hidden = false;
  $: visible = false;
</script>

<svelte:body
  on:keydown="{({ key }) => {
    if (key === 'Escape') {
      hidden = true;
    }
  }}" />

<div
  class:bx--tooltip--definition="{true}"
  class:bx--tooltip--a11y="{true}"
  {...$$restProps}
  on:mouseenter="{() => {
    hidden = false;
    visible = true;
  }}"
  on:mouseleave="{() => {
    visible = false;
  }}"
>
  <button
    bind:this="{ref}"
    aria-describedby="{id}"
    class:bx--tooltip--a11y="{true}"
    class:bx--tooltip__trigger="{true}"
    class:bx--tooltip__trigger--definition="{true}"
    class:bx--tooltip--hidden="{hidden}"
    class:bx--tooltip--visible="{visible}"
    class="{direction && `bx--tooltip--${direction}`}
      {align && `bx--tooltip--align-${align}`}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:focus="{() => {
      hidden = false;
    }}"
  >
    <slot />
  </button>
  <div role="tooltip" id="{id}" class:bx--assistive-text="{true}">
    {tooltipText}
  </div>
</div>
