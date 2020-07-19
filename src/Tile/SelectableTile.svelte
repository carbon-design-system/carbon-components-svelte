<script>
  export let selected = false;
  export let light = false;
  export let title = "title";
  export let value = "value";
  export let tabindex = "0";
  export let iconDescription = "Tile checkmark";
  export let id = "ccs-" + Math.random().toString(36);
  export let name = "";
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import CheckmarkFilled16 from "carbon-icons-svelte/lib/CheckmarkFilled16";

  const dispatch = createEventDispatcher();

  $: dispatch(selected ? "select" : "deselect", id);
</script>

<input
  bind:this={ref}
  type="checkbox"
  tabindex="-1"
  class:bx--tile-input={true}
  checked={selected}
  {id}
  {value}
  {name}
  {title} />
<label
  for={id}
  {tabindex}
  class:bx--tile={true}
  class:bx--tile--selectable={true}
  class:bx--tile--is-selected={selected}
  class:bx--tile--light={light}
  {...$$restProps}
  on:click
  on:click|preventDefault={() => {
    selected = !selected;
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      selected = !selected;
    }
  }}>
  <span class:bx--tile__checkmark={true}>
    <CheckmarkFilled16 aria-label={iconDescription} title={iconDescription} />
  </span>
  <span class:bx--tile-content={true}>
    <slot />
  </span>
</label>
