<script>
  /**
   * @template {string} [Value=string]
   */

  /** Set to `true` to use as a header */
  export let head = false;

  /** Set to `true` to render a label slot */
  export let label = false;

  /**
   * Specify the value of the nested `StructuredListInput`, so a selectable
   * row can reflect its own selected state (e.g. suppressing the hover
   * highlight when already selected). Only relevant when `selection` is
   * `true` on the parent `StructuredList`.
   * @type {Value}
   */
  export let value = undefined;

  /**
   * Specify the tabindex.
   * @deprecated no longer applied here -- the row's own `<label>` isn't
   * a tab stop anymore. Set `tabindex` on `StructuredListInput` instead,
   * which now owns focus for the selectable row.
   * @type {number | string | undefined}
   */
  export const tabindex = "0";

  import { getContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import StructuredListCell from "./StructuredListCell.svelte";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? readable(false);
  const icon = ctx?.icon ?? readable(CheckmarkFilled);
  const multiple = ctx?.multiple ?? readable(false);
  // Standalone (no wrapper context) never matches, same as StructuredListInput.
  const selectedValue = ctx?.selectedValue ?? writable(undefined);
  const rowValues = ctx?.rowValues ?? readable([]);

  /** @type {null | HTMLInputElement} */
  let selectAllRef = null;

  $: rowValueSet = head ? new Set($rowValues) : new Set();
  $: selectedCount = head ? countSelected(rowValueSet, $selectedValue) : 0;
  $: allSelected = rowValueSet.size > 0 && selectedCount === rowValueSet.size;
  $: someSelected = selectedCount > 0 && !allSelected;
  // `indeterminate` is a property only; there is no attribute to render.
  $: if (selectAllRef) selectAllRef.indeterminate = someSelected;

  /**
   * @param {Set<Value>} values
   * @param {Value | Value[] | undefined} selected
   */
  function countSelected(values, selected) {
    if (!Array.isArray(selected)) return 0;
    let count = 0;
    for (const v of new Set(selected)) {
      if (values.has(v)) count++;
    }
    return count;
  }

  function toggleAll() {
    const next = allSelected ? [] : [...rowValueSet];
    selectedValue.set(next);
    // The browser already flipped `checked`; resync in case the state
    // did not change (e.g. no rows to select).
    selectAllRef.checked = next.length > 0;
  }

  $: isSelected =
    value !== undefined &&
    ($multiple
      ? Array.isArray($selectedValue) && $selectedValue.includes(value)
      : $selectedValue === value);
</script>

{#if label}
  <label
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    class:bx--structured-list-row--selected={isSelected}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
    {#if $selection}
      <StructuredListCell style="width: 1px; white-space: nowrap;">
        <svelte:component this={$icon} class="bx--structured-list-svg" />
      </StructuredListCell>
    {/if}
  </label>
{:else}
  <div
    role={$selection ? undefined : "row"}
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    class:bx--structured-list-row--selected={isSelected}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
    {#if $selection && head}
      <StructuredListCell head style="width: 1px;">
        {#if $multiple}
          <input
            bind:this={selectAllRef}
            type="checkbox"
            aria-label="Select all rows"
            checked={allSelected}
            on:change={toggleAll}
          >
        {:else}
          <span class:bx--visually-hidden={true}>Select row</span>
        {/if}
      </StructuredListCell>
    {/if}
  </div>
{/if}
