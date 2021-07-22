<script>
  /** Specify the tooltip text */
  export let tooltipText = "";

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the icon
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /** Set an id for the tooltip div element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  let visible = false;

  function hide() {
    visible = false;
  }

  function show() {
    visible = true;
  }
</script>

<svelte:window
  on:keydown="{({ key }) => {
    if (key === 'Escape') hide();
  }}"
/>

<span
  class:bx--tooltip--definition="{true}"
  class:bx--tooltip--a11y="{true}"
  {...$$restProps}
  on:mouseenter="{show}"
  on:mouseleave="{hide}"
>
  <button
    bind:this="{ref}"
    aria-describedby="{id}"
    class:bx--tooltip--a11y="{true}"
    class:bx--tooltip__trigger="{true}"
    class:bx--tooltip__trigger--definition="{true}"
    class:bx--tooltip--hidden="{!visible}"
    class:bx--tooltip--visible="{visible}"
    class:bx--tooltip--top="{direction === 'top'}"
    class:bx--tooltip--bottom="{direction === 'bottom'}"
    class:bx--tooltip--align-start="{align === 'start'}"
    class:bx--tooltip--align-center="{align === 'center'}"
    class:bx--tooltip--align-end="{align === 'end'}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:focus="{show}"
    on:blur="{hide}"
  >
    <slot />
  </button>
  <div role="tooltip" id="{id}" class:bx--assistive-text="{true}">
    <slot name="tooltip">{tooltipText}</slot>
  </div>
</span>
