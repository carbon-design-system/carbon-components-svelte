<script>
  /** Set to `true` to check the tile */
  export let checked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Specify the value of the radio input */
  export let value = "";

  /** Specify the title of the selectable tile */
  export let title = "title";

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Specify the ARIA label for the radio tile checkmark icon */
  export let iconDescription = "Tile checkmark";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify a name attribute for the input */
  export let name = "";

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext } from "svelte";
  import CheckmarkFilled16 from "carbon-icons-svelte/lib/CheckmarkFilled16";

  const { _light, add, update, selectedValue } = getContext("RadioTileGroup");

  light = light || _light;

  add({ value, checked });

  $: checked = value === $selectedValue;
</script>

<input
  bind:this="{ref}"
  type="radio"
  id="{id}"
  name="{name}"
  value="{value}"
  checked="{checked}"
  tabindex="-1"
  class:bx--tile-input="{true}"
  title="{title}"
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
  tabindex="{tabindex}"
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
