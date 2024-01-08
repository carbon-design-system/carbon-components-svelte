<script>
  /**
   * @event {null} open
   * @event {null} close
   */

  /** Specify the tooltip text */
  export let tooltipText = "";

  /**
   * Set to `true` to open the tooltip
   */
  export let open = false;

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

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const hide = () => (open = false);

  const show = () => (open = true);

  $: dispatch(open ? "open" : "close");
</script>

<svelte:window
  on:keydown="{({ key }) => {
    if (key === 'Escape') hide();
  }}"
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  class:cds--tooltip--definition="{true}"
  class:cds--tooltip--a11y="{true}"
  {...$$restProps}
  on:mouseenter="{show}"
  on:mouseleave="{hide}"
>
  <button
    bind:this="{ref}"
    type="button"
    aria-describedby="{id}"
    class:cds--tooltip--a11y="{true}"
    class:cds--tooltip__trigger="{true}"
    class:cds--tooltip__trigger--definition="{true}"
    class:cds--tooltip--hidden="{!open}"
    class:cds--tooltip--visible="{open}"
    class:cds--tooltip--top="{direction === 'top'}"
    class:cds--tooltip--bottom="{direction === 'bottom'}"
    class:cds--tooltip--align-start="{align === 'start'}"
    class:cds--tooltip--align-center="{align === 'center'}"
    class:cds--tooltip--align-end="{align === 'end'}"
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
  <div role="tooltip" id="{id}" class:cds--assistive-text="{true}">
    <slot name="tooltip">{tooltipText}</slot>
  </div>
</span>
