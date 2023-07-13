<script>
  /** Set to `true` to check the tile */
  export let checked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the tile */
  export let disabled = false;

  /** Specify the value of the radio input */
  export let value = "";

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Specify the ARIA label for the radio tile checkmark icon */
  export let iconDescription = "Tile checkmark";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify a name attribute for the input */
  export let name = "";

  import { getContext } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";

  const { add, update, selectedValue } = getContext("TileGroup");

  add({ value, checked });

  $: checked = value === $selectedValue;
</script>

<input
  type="radio"
  id="{id}"
  name="{name}"
  value="{value}"
  checked="{checked}"
  tabindex="{disabled ? undefined : tabindex}"
  disabled="{disabled}"
  class:bx--tile-input="{true}"
  on:change
  on:change="{() => {
    if (disabled) return;
    update(value);
  }}"
  on:keydown
  on:keydown="{(e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      update(value);
    }
  }}"
/>
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<label
  for="{id}"
  class:bx--tile="{true}"
  class:bx--tile--selectable="{true}"
  class:bx--tile--is-selected="{checked}"
  class:bx--tile--light="{light}"
  class:bx--tile--disabled="{disabled}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--tile__checkmark="{true}">
    <CheckmarkFilled aria-label="{iconDescription}" title="{iconDescription}" />
  </span>
  <span class:bx--tile-content="{true}">
    <slot />
  </span>
</label>
