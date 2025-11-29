<script>
  /**
   * @generics {T extends string = string} T
   * @template {string} T
   * @event {T} select
   * @event {T} deselect
   */

  /**
   * Specify the selected tile values
   * @type {T[]}
   */
  export let selected = [];

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /**
   * Specify a name attribute for the checkbox inputs
   * @type {string | undefined}
   */
  export let name = undefined;

  /** Specify the legend text */
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<T[]>}
   */
  const selectedValues = writable(selected);
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const groupName = writable(name);
  /**
   * @type {import("svelte/store").Readable<string | undefined>}
   */
  const groupNameReadonly = readonly(groupName);

  /**
   * @type {(data: { selected: boolean; value: T }) => void}
   */
  const add = ({ selected: isSelected, value }) => {
    if (isSelected && !$selectedValues.includes(value)) {
      selectedValues.update((values) => [...values, value]);
    }
  };

  /**
   * @type {(data: { value: T; selected: boolean }) => void}
   */
  const update = ({ value, selected: isSelected }) => {
    if (isSelected) {
      if (!$selectedValues.includes(value)) {
        selectedValues.update((values) => [...values, value]);
        dispatch("select", value);
      }
    } else {
      if ($selectedValues.includes(value)) {
        selectedValues.update((values) => values.filter((v) => v !== value));
        dispatch("deselect", value);
      }
    }
  };

  setContext("SelectableTileGroup", {
    selectedValues,
    groupName: groupNameReadonly,
    add,
    update,
  });

  $: selected = $selectedValues;
  $: selectedValues.set(selected);
  $: groupName.set(name);
</script>

<fieldset {disabled} class:bx--tile-group={true} {...$$restProps}>
  {#if legend}
    <legend class:bx--label={true}>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
