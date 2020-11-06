<script>
  /** Set to `true` to check the tile */
  export let checked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

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
  import CheckmarkFilled16 from "carbon-icons-svelte/lib/CheckmarkFilled16";

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
  tabindex="{tabindex}"
  class:bx--tile-input="{true}"
  on:change
  on:change="{() => {
    update(value);
  }}"
  on:keydown
  on:keydown="{(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      update(value);
    }
  }}"
/>
<label
  for="{id}"
  class:bx--tile="{true}"
  class:bx--tile--selectable="{true}"
  class:bx--tile--is-selected="{checked}"
  class:bx--tile--light="{light}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--tile__checkmark="{true}">
    <CheckmarkFilled16
      aria-label="{iconDescription}"
      title="{iconDescription}"
    />
  </span>
  <span class:bx--tile-content="{true}">
    <slot />
  </span>
</label>
