<script>
  /**
   * Specify the selected tile value
   * @type {string}
   */
  export let selected = undefined;

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /**
   * Set to `true` to mark the selection as required.
   * For validation to trigger, a `name` has to be specified as well.
   */
  export let required = false;

  /** Specify a name attribute for the radio inputs */
  export let name = "";

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);
  const inputsName = writable(name);
  const inputsRequired = writable(required);

  setContext("TileGroup", {
    selectedValue,
    name: { subscribe: inputsName.subscribe },
    required: { subscribe: inputsRequired.subscribe },
    add: ({ checked, value }) => {
      if (checked) {
        selectedValue.set(value);
      }
    },
    update: (value) => {
      selectedValue.set(value);
    },
  });

  $: selected = $selectedValue;
  $: inputsName.set(name);
  $: inputsRequired.set(required);
  $: dispatch("select", $selectedValue);
</script>

<fieldset disabled="{disabled}" class:bx--tile-group="{true}" {...$$restProps}>
  {#if legend}
    <legend class:bx--label="{true}">{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
