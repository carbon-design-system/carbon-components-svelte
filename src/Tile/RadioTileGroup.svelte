<script>
  /**
   * Specify the selected tile value
   * @type {any}
   */
  export let selectedValue = undefined;

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const _selectedValue = writable(selectedValue);

  setContext("RadioTileGroup", {
    selectedValue: _selectedValue,
    add: ({ checked, value }) => {
      if (checked) {
        _selectedValue.set(value);
      }
    },
    update: (value) => {
      _selectedValue.set(value);
    },
  });

  $: selectedValue = $_selectedValue;
  $: dispatch("select", $_selectedValue);
</script>

<fieldset disabled="{disabled}" class:bx--tile-group="{true}" {...$$restProps}>
  {#if legend}
    <legend class:bx--label="{true}">{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
