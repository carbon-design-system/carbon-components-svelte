<script>
  /**
   * @template {string} [T=string]
   * @event {T} select
   * @event {T} deselect
   */

  /**
   * Specify the selected tile values.
   * @type {T[]}
   * @bindable writable
   */
  export let selected = [];

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /**
   * Specify a name attribute for the checkbox inputs.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <SelectableTileGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   * </SelectableTileGroup>
   * ```
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";
  import { rangeSlice } from "../utils/range-slice.js";

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

  /** @type {HTMLFieldSetElement | null} */
  let fieldsetRef = null;

  /**
   * Anchor value for Shift+click/Shift+keyboard range selection: the
   * last tile toggled, with or without Shift. `null` until the first
   * toggle, or once resolved to a value that no longer maps to a tile
   * in the group.
   * @type {T | null}
   */
  let rangeAnchorValue = null;

  /**
   * The group's tile `<input>` elements in DOM order. Queried live from
   * the DOM (rather than tracked via registration order) because tiles
   * can be added, removed, or reordered dynamically, and registration
   * order isn't guaranteed to match DOM order afterward.
   * @type {() => HTMLInputElement[]}
   */
  function getOrderedInputs() {
    if (!fieldsetRef) return [];
    return Array.from(fieldsetRef.querySelectorAll(".bx--tile-input"));
  }

  /**
   * Apply `isSelected` to every enabled tile between the anchor tile
   * and `value` (inclusive, DOM order). Returns `false` if the anchor
   * tile is no longer present (for example, unmounted or filtered out
   * elsewhere), so the caller can fall back to a single toggle.
   * @type {(value: T, isSelected: boolean) => boolean}
   */
  function selectRange(value, isSelected) {
    const inputs = getOrderedInputs();
    const anchorIndex = inputs.findIndex(
      (input) => input.value === rangeAnchorValue,
    );
    const targetIndex = inputs.findIndex((input) => input.value === value);
    const range =
      targetIndex === -1 ? null : rangeSlice(inputs, anchorIndex, targetIndex);
    if (range === null) return false;

    const next = new Set($selectedValues);
    let changed = false;
    for (const input of range) {
      if (input.disabled) continue;
      if (isSelected && !next.has(input.value)) {
        next.add(input.value);
        changed = true;
      } else if (!isSelected && next.has(input.value)) {
        next.delete(input.value);
        changed = true;
      }
    }

    // Batch: one store update for the whole range instead of one per tile.
    if (changed) {
      selectedValues.set([...next]);
    }

    return true;
  }

  /**
   * @type {(data: { selected: boolean; value: T }) => void}
   */
  function add({ selected: isSelected, value }) {
    if (isSelected && !$selectedValues.includes(value)) {
      selectedValues.update((values) => [...values, value]);
    }
  }

  /**
   * @type {(value: T) => void}
   */
  function remove(value) {
    if ($selectedValues.includes(value)) {
      selectedValues.update((values) => values.filter((v) => v !== value));
    }
  }

  /**
   * @type {(data: {
   *   value: T;
   *   selected: boolean;
   *   shiftKey?: boolean;
   * }) => void}
   */
  function update({ value, selected: isSelected, shiftKey }) {
    const usedRange =
      shiftKey && rangeAnchorValue !== null && selectRange(value, isSelected);

    if (usedRange) {
      dispatch(isSelected ? "select" : "deselect", value);
    } else if (isSelected) {
      if (!$selectedValues.includes(value)) {
        selectedValues.update((values) => [...values, value]);
        dispatch("select", value);
      }
    } else if ($selectedValues.includes(value)) {
      selectedValues.update((values) => values.filter((v) => v !== value));
      dispatch("deselect", value);
    }

    rangeAnchorValue = value;
  }

  /**
   * True while Shift is held during a mousedown gesture inside the
   * group; suppresses the browser's native Shift+click text-selection
   * highlight spanning multiple tiles.
   */
  let shiftMouseActive = false;

  setContext("carbon:SelectableTileGroup", {
    selectedValues,
    groupName: groupNameReadonly,
    add,
    remove,
    update,
  });

  $: selected = $selectedValues;
  $: selectedValues.set(selected);
  $: groupName.set(name);
</script>

<fieldset
  bind:this={fieldsetRef}
  {disabled}
  class:bx--tile-group={true}
  {...$$restProps}
  on:mousedown|capture={(event) => {
    shiftMouseActive = event.shiftKey;
  }}
  on:mouseup|capture={() => {
    shiftMouseActive = false;
  }}
  on:selectstart|capture={(event) => {
    if (shiftMouseActive) event.preventDefault();
  }}
>
  {#if legendText || $$slots.legendChildren}
    <legend class:bx--label={true} class:bx--visually-hidden={hideLegend}>
      <slot name="legendChildren">{legendText}</slot>
    </legend>
  {/if}
  <div><slot /></div>
</fieldset>
