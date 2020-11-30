<script>
  /**
   * Specify the selected tile's
   * @type {any[]}
   */
  export let selectedValues = [];

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const _selectedValues = writable(selectedValues);

  function newArray(value, selected) {
    let a = [...$_selectedValues];
    const i = a.indexOf(value);
    if (selected && i === -1) {
      a.push(value);
    } else if (!selected && i > -1) {
      a.splice(i, 1);
    }
    return a;
  }

  setContext("SelectableTileGroup", {
    selectedValues: _selectedValues,
    update: ({ selected, value }) =>
      _selectedValues.set(newArray(value, selected)),
  });

  $: selectedValues = $_selectedValues;
  $: dispatch("select", $_selectedValues);
</script>

<fieldset disabled="{disabled}" class:bx--tile-group="{true}" {...$$restProps}>
  {#if legend}
    <legend class:bx--label="{true}">{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
