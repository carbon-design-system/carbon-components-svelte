<script>
  /**
   * @template {string} [T=string]
   * @event {T} select
   * @event {T} deselect
   * @event {T[]} change - Fires once per user toggle or range, after `select` and `deselect`, with every selected value.
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
  import { get, readonly, writable } from "svelte/store";
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
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const groupDisabled = writable(disabled);

  /** @type {HTMLFieldSetElement | null} */
  let fieldsetRef = null;

  /**
   * Anchor value for Shift+click/Shift+keyboard range selection: the last
   * tile toggled, with or without Shift. `null` until the first toggle, or
   * once resolved to a value that no longer maps to a tile in the group.
   * @type {T | null}
   */
  let rangeAnchorValue = null;

  /**
   * The group's own tile `<input>` elements in DOM order. Queried live from the
   * DOM (rather than tracked via registration order) because tiles can be
   * added, removed, or reordered dynamically, and registration order isn't
   * guaranteed to match DOM order afterward.
   * @type {() => HTMLInputElement[]}
   */
  function getOrderedInputs() {
    if (!fieldsetRef) return [];
    // Skip tiles that belong to a nested tile group (or radio tiles), whose
    // values aren't this group's to select.
    return Array.from(
      fieldsetRef.querySelectorAll('input[type="checkbox"].bx--tile-input'),
      (input) => /** @type {HTMLInputElement} */ (input),
    ).filter((input) => input.closest(".bx--tile-group") === fieldsetRef);
  }

  /**
   * Apply `isSelected` to every enabled tile between the anchor tile and
   * `value` (inclusive, DOM order). Returns the values whose membership
   * changed, in DOM order, or `null` if the anchor tile is no longer present
   * (for example, unmounted or filtered out elsewhere), so the caller can
   * fall back to a single toggle.
   * @type {(value: T, isSelected: boolean) => T[] | null}
   */
  function selectRange(value, isSelected) {
    const inputs = getOrderedInputs();
    const anchorIndex = inputs.findIndex(
      (input) => input.value === rangeAnchorValue,
    );
    const targetIndex = inputs.findIndex((input) => input.value === value);
    const range =
      targetIndex === -1 ? null : rangeSlice(inputs, anchorIndex, targetIndex);
    if (range === null) return null;

    const next = new Set($selectedValues);
    /** @type {T[]} */
    const changed = [];
    for (const input of range) {
      if (input.disabled) continue;
      const inputValue = /** @type {T} */ (input.value);
      if (isSelected && !next.has(inputValue)) {
        next.add(inputValue);
        changed.push(inputValue);
      } else if (!isSelected && next.has(inputValue)) {
        next.delete(inputValue);
        changed.push(inputValue);
      }
    }

    // Batch: one store update for the whole range instead of one per tile.
    if (changed.length > 0) {
      selectedValues.set([...next]);
    }

    return changed;
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
   * @type {(data: { value: T; selected: boolean; shiftKey?: boolean }) => void}
   */
  function update({ value, selected: isSelected, shiftKey }) {
    const rangeChanged =
      shiftKey && rangeAnchorValue !== null
        ? selectRange(value, isSelected)
        : null;

    let changed = false;

    if (rangeChanged) {
      // One event per tile the range changed, so `select`/`deselect`
      // listeners see every value, not just the clicked tile's.
      for (const changedValue of rangeChanged) {
        dispatch(isSelected ? "select" : "deselect", changedValue);
      }
      changed = rangeChanged.length > 0;
    } else if (isSelected) {
      if (!$selectedValues.includes(value)) {
        selectedValues.update((values) => [...values, value]);
        dispatch("select", value);
        changed = true;
      }
    } else if ($selectedValues.includes(value)) {
      selectedValues.update((values) => values.filter((v) => v !== value));
      dispatch("deselect", value);
      changed = true;
    }

    rangeAnchorValue = value;

    if (changed) dispatch("change", get(selectedValues));
  }

  /**
   * How many mounted tiles use each value. Tiles that share a value share
   * one selection state, so selecting one selects them all.
   * @type {Map<T, number>}
   */
  const registeredValues = new Map();

  /** @type {Set<T>} */
  const warnedValues = new Set();

  /**
   * Count a tile's value and warn once if two tiles share it. The check
   * waits for the current update to finish: tiles in a non-keyed `{#each}`
   * swap values one at a time, so a duplicate can exist only mid-update.
   * Returns a function that releases the value.
   * @type {(value: T) => () => void}
   */
  function register(value) {
    const count = (registeredValues.get(value) ?? 0) + 1;
    registeredValues.set(value, count);
    if (count === 2 && !warnedValues.has(value)) {
      queueMicrotask(() => {
        if ((registeredValues.get(value) ?? 0) < 2 || warnedValues.has(value))
          return;
        warnedValues.add(value);
        console.warn(
          `[SelectableTileGroup.svelte] multiple tiles share the value "${value}", so they select together. Give each SelectableTile a unique \`value\`.`,
        );
      });
    }
    return () => {
      const remaining = (registeredValues.get(value) ?? 1) - 1;
      if (remaining > 0) registeredValues.set(value, remaining);
      else registeredValues.delete(value);
    };
  }

  /** True while Shift is held during a mousedown gesture inside the group; suppresses the browser's native Shift+click text-selection highlight spanning multiple tiles. */
  let shiftMouseActive = false;

  setContext("carbon:SelectableTileGroup", {
    selectedValues,
    groupName: groupNameReadonly,
    groupDisabled: readonly(groupDisabled),
    add,
    remove,
    update,
    register,
  });

  $: selected = $selectedValues;
  // Skip echoing the store's own array back into it: an object `set` always
  // notifies, which would re-run every tile's subscription per toggle.
  $: if (selected !== $selectedValues) selectedValues.set(selected);
  $: groupName.set(name);
  $: groupDisabled.set(disabled);
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
