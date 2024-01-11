<script>
  /**
   * @event {string} "select"
   * @event {string} "deselect"
   */

  /** Set to `true` to select the tile */
  export let selected = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the tile */
  export let disabled = false;

  /** Specify the title of the selectable tile */
  export let title = "title";

  /** Specify the value of the selectable tile */
  export let value = "value";

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Specify the ARIA label for the selectable tile checkmark icon */
  export let iconDescription = "Tile checkmark";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = "";

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";

  const dispatch = createEventDispatcher();

  $: if (!disabled) dispatch(selected ? "select" : "deselect", id);
</script>

<input
  bind:this="{ref}"
  type="checkbox"
  tabindex="-1"
  class:bx--tile-input="{true}"
  checked="{selected}"
  id="{id}"
  value="{value}"
  name="{name}"
  title="{title}"
  disabled="{disabled}"
/>
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<label
  for="{id}"
  tabindex="{disabled ? undefined : tabindex}"
  class:bx--tile="{true}"
  class:bx--tile--selectable="{true}"
  class:bx--tile--is-selected="{selected}"
  class:bx--tile--light="{light}"
  class:bx--tile--disabled="{disabled}"
  {...$$restProps}
  on:click
  on:click|preventDefault="{() => {
    if (disabled) return;
    selected = !selected;
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown="{(e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      selected = !selected;
    }
  }}"
>
  <span class:bx--tile__checkmark="{true}">
    <CheckmarkFilled aria-label="{iconDescription}" title="{iconDescription}" />
  </span>
  <span class:bx--tile-content="{true}">
    <slot />
  </span>
</label>
