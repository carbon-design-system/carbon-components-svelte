<script>
  /**
   * @event {null} open
   * @event {null} close
   */

  /** Specify the term definition. */
  export let definition = "";

  /**
   * Set to `true` to open the tooltip
   */
  export let open = false;

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right" | "left" | "left-bottom" | "left-top" | "right" | "right-bottom" | "right-top"}
   */
  export let align = "bottom-left";

  /** Set an id for the tooltip div element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Popover from "../Popover/Popover.svelte";
  import PopoverContent from "../Popover/PopoverContent.svelte";

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
<Popover highContrast dropShadow="{false}" bind:open align="{align}">
  <button
    bind:this="{ref}"
    type="button"
    aria-describedby="{id}"
    class:bx--definition-term="{true}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:focus="{show}"
    on:blur="{hide}"
    on:mouseenter="{show}"
    on:mouseleave="{hide}"
  >
    <slot />
  </button>
  <PopoverContent className="{'bx--definition-tooltip'}">
    <slot name="definition">{definition}</slot>
  </PopoverContent>
</Popover>
