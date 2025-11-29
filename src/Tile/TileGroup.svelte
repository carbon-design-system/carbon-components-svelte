<script>
  /**
   * @generics {T extends string = string} T
   * @template {string} T
   * @event {T} select
   */

  /**
   * Specify the selected tile value
   * @type {T | undefined}
   */
  export let selected = undefined;

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /**
   * Set to `true` to require the selection of a radio button
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify a name attribute for the radio button inputs
   * @type {string}
   */
  export let name = undefined;

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<T | undefined>}
   */
  const selectedValue = writable(selected);
  const groupName = writable(name);
  const groupRequired = writable(required);

  /**
   * @type {(data: { checked: boolean; value: T }) => void}
   */
  const add = ({ checked, value }) => {
    if (checked) {
      selectedValue.set(value);
    }
  };

  /**
   * @type {(value: T) => void}
   */
  const update = (value) => {
    selectedValue.set(value);
    dispatch("select", value);
  };

  setContext("TileGroup", {
    selectedValue,
    groupName: readonly(groupName),
    groupRequired: readonly(groupRequired),
    add,
    update,
  });

  $: selected = $selectedValue;
  $: selectedValue.set(selected);
  $: $groupName = name;
  $: $groupRequired = required;
</script>

<fieldset {disabled} class:bx--tile-group={true} {...$$restProps}>
  {#if legend}
    <legend class:bx--label={true}>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
