<script>
  export let checked = false;
  export let light = false;
  export let value = "";
  export let tabindex = "0";
  export let iconDescription = "Tile checkmark";
  export let id = "ccs-" + Math.random().toString(36);
  export let name = "";

  import { getContext } from "svelte";
  import CheckmarkFilled16 from "carbon-icons-svelte/lib/CheckmarkFilled16";

  const { add, update, selectedValue } = getContext("TileGroup");

  add({ value, checked });

  $: checked = value === $selectedValue;
</script>

<input
  type="radio"
  {id}
  {name}
  {value}
  {checked}
  class:bx--tile-input={true}
  on:change
  on:change={() => {
    update(value);
  }} />
<label
  for={id}
  {tabindex}
  class:bx--tile={true}
  class:bx--tile--selectable={true}
  class:bx--tile--is-selected={checked}
  class:bx--tile--light={light}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      update(value);
    }
  }}>
  <span class:bx--tile__checkmark={true}>
    <CheckmarkFilled16 aria-label={iconDescription} title={iconDescription} />
  </span>
  <span class:bx--tile-content={true}>
    <slot />
  </span>
</label>
