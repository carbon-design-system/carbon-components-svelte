<script>
  /**
   * Specify the selected tile's
   * @type {any[]}
   */
  export let selectedValues = [];

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const _selectedValues = writable(selectedValues);

  setContext("SelectableTileGroup", {
    selectedValues: _selectedValues,
    update: ({ selected, value }) =>
      _selectedValues.update((_) => {
        if (_.includes(value) && !selected) {
          return _.filter((i) => i !== value);
        }
        return selected ? [..._, value] : _; // else no update
      }),
  });

  $: selectedValues = $_selectedValues;
  $: dispatch("select", $_selectedValues);
</script>

<fieldset class:bx--tile-group="{true}" {...$$restProps}>
  {#if legend}
    <legend class:bx--label="{true}">{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
