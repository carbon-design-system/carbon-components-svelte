<script>
  /**
   * Set to `true` to check the tile
   * @type {boolean} [checked=false]
   */
  export let checked = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Specify the value of the radio input
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Specify the tabindex
   * @type {string} [tabindex="0"]
   */
  export let tabindex = "0";

  /**
   * Specify the ARIA label for the radio tile checkmark icon
   * @type {string} [iconDescription="Tile checkmark"]
   */
  export let iconDescription = "Tile checkmark";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string} [name=""]
   */
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
  on:keydown={(e) => {
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
