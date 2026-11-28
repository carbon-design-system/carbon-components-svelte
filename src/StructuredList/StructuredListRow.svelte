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
   * row can show its own selected state: a selected fill, with no hover
   * highlight. Only relevant when `selection` is `true` on the parent
   * `StructuredList`.
   * @type {Value | undefined}
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

  import { getContext, onMount } from "svelte";
  import { readable, writable } from "svelte/store";
  import InlineCheckbox from "../Checkbox/InlineCheckbox.svelte";
  import BuiltinCheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import { getIconContext } from "../utils/icon-context.js";
  import { noop } from "../utils/noop.js";
  import StructuredListCell from "./StructuredListCell.svelte";

  const { CheckmarkFilled = BuiltinCheckmarkFilled } = getIconContext();

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? readable(false);
  const icon = ctx?.icon ?? readable(CheckmarkFilled);
  const multiple = ctx?.multiple ?? readable(false);
  // Standalone (no wrapper context) never matches, same as StructuredListInput.
  const selectedValue = ctx?.selectedValue ?? writable(undefined);
  /** @type {import("svelte/store").Readable<Value[]>} */
  const selectableValues = ctx?.selectableValues ?? readable([]);
  const selectAllDescription =
    ctx?.selectAllDescription ?? readable("Select all rows");
  const toggleAll = ctx?.toggleAll ?? noop;

  // Counts only rows that are not disabled, so a disabled row neither
  // blocks the checked state nor joins select all.
  $: selectedCount =
    head && $multiple && Array.isArray($selectedValue)
      ? $selectableValues.filter((v) => $selectedValue.includes(v)).length
      : 0;
  $: allSelected =
    $selectableValues.length > 0 && selectedCount === $selectableValues.length;
  $: someSelected = selectedCount > 0 && !allSelected;

  // Rows register after the header renders, so the server sees none.
  // Disable the header checkbox only once mounted rows show there are none
  // to select, so the server does not render it disabled.
  let mounted = false;
  onMount(() => {
    mounted = true;
  });

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
      {#if $multiple}
        <!-- Each body row has a column for its hidden input before the
             icon. An empty one here puts select all over the icons. -->
        <span class:bx--structured-list-input-wrapper={true}></span>
      {/if}
      <!-- Keeps the selection column's width. Selection drops the table
           roles, so a column name here would only be stray text. -->
      <StructuredListCell head style="width: 1px;">
        {#if $multiple}
          <InlineCheckbox
            aria-label={$selectAllDescription}
            checked={allSelected}
            indeterminate={someSelected}
            disabled={mounted && $selectableValues.length === 0}
            on:change={toggleAll}
          />
        {/if}
      </StructuredListCell>
    {/if}
  </div>
{/if}
