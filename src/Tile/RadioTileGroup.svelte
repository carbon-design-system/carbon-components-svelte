<script>
  /**
   * Specify the selected tile value
   * @type {string}
   */
  export let selectedValue = undefined;

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const _selectedValue = writable(selectedValue);

  setContext("RadioTileGroup", {
    _light: light,
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
