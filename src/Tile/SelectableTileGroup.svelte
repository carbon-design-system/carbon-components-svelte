<script>
  /**
   * Specify the selected tile's
   * @type {any[]}
   */
  export let selectedValues = [];

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /** Specify the legend text */
  export let legend = "";

  /** Set to `true` to enable the light variant throughout the group */
  export let light = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const _selectedValues = writable([]);

  $: _selectedValues.set(selectedValues);

  setContext("SelectableTileGroup", {
    _light: light,
    selectedValues: _selectedValues,
    update: ({ selected, value }) =>
      _selectedValues.update((_) => {
        if (_.includes(value) && !selected) {
          return _.filter((i) => i !== value);
        }
        return selected ? [..._, value] : _; // else no update
      }),
  });

  $: selectedValues = $_selectedValues.map();
  $: dispatch("select", $_selectedValues);
</script>

<fieldset disabled="{disabled}" class:bx--tile-group="{true}" {...$$restProps}>
  {#if legend}
    <legend class:bx--label="{true}">{legend}</legend>
  {/if}
  <div
    role="group"
    aria-label="{$$props['aria-label'] || 'Selectable tiles'}"
    data-selected="{selectedValues}"
  >
    <slot />
  </div>
</fieldset>
