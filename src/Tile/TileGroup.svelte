<script>
  /**
   * @template {string} [T=string]
   * @event {T} select
   */

  /**
   * Specify the selected tile value.
   * @type {T | undefined}
   * @bindable writable
   */
  export let selected = undefined;

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /**
   * Set to `true` to require the selection of a radio button.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify a name attribute for the radio button inputs.
   * Defaults to a generated id so the tiles form one radio group;
   * set it explicitly when form submission matters.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <TileGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   * </TileGroup>
   * ```
   */
  export let legendText = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<T | undefined>}
   */
  const selectedValue = writable(selected);
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  // Unnamed radios are separate controls, so arrow keys would not move
  // between tiles; share one generated name when `name` is omitted.
  const fallbackName = uniqueId();
  const groupName = writable(name || fallbackName);
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
  function add({ checked, value }) {
    if (checked) {
      selectedValue.set(value);
    }
  }

  /**
   * @type {(value: T) => void}
   */
  function update(value) {
    selectedValue.set(value);
    dispatch("select", value);
  }

  setContext("carbon:TileGroup", {
    selectedValue,
    groupName: groupNameReadonly,
    groupRequired: groupRequiredReadonly,
    add,
    update,
  });

  $: selected = $selectedValue;
  $: selectedValue.set(selected);
  $: groupName.set(name || fallbackName);
  $: groupRequired.set(required);
</script>

<fieldset {disabled} class:bx--tile-group={true} {...$$restProps}>
  {#if legendText || $$slots.legendChildren}
    <legend class:bx--label={true}>
      <slot name="legendChildren">{legendText}</slot>
    </legend>
  {/if}
  <div><slot /></div>
</fieldset>
