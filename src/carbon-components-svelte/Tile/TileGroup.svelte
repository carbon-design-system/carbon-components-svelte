<script>
  /**
   * Specify the selected tile value
   * @type {string}
   */
  export let selected = undefined;

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("TileGroup", {
    selectedValue,
    add: ({ checked, value }) => {
      if (checked) {
        selectedValue.set(value);
      }
    },
    update: (value) => {
      selectedValue.set(value);
      dispatch("select", value);
    },
  });

  $: selected = $selectedValue;
  $: selectedValue.set(selected);
</script>

<fieldset disabled="{disabled}" class:bx--tile-group="{true}" {...$$restProps}>
  {#if legend}
    <legend class:bx--label="{true}">{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
