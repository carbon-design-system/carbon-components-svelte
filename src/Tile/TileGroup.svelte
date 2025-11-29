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
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const groupName = writable(name);
  /**
   * @type {import("svelte/store").Writable<boolean | undefined>}
   */
  const groupRequired = writable(required);
  /**
   * @type {import("svelte/store").Readable<string | undefined>}
   */
  const groupNameReadonly = readonly(groupName);
  /**
   * @type {import("svelte/store").Readable<boolean | undefined>}
   */
  const groupRequiredReadonly = readonly(groupRequired);

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
    groupName: groupNameReadonly,
    groupRequired: groupRequiredReadonly,
    add,
    update,
  });

  $: selected = $selectedValue;
  $: selectedValue.set(selected);
  $: groupName.set(name);
  $: groupRequired.set(required);
</script>

<fieldset {disabled} class:bx--tile-group={true} {...$$restProps}>
  {#if legend}
    <legend class:bx--label={true}>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
