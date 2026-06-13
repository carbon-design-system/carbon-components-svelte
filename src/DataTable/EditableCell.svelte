<script>
  /**
   * @template {import("./DataTable.svelte").DataTableRow} [Row=import("./DataTable.svelte").DataTableRow]
   */

  /**
   * @restProps {div}
   * @slot {{ invalid: boolean; invalidText: string | undefined; }}
   */

  /**
   * Specify the row this cell belongs to.
   * Provided by the `cell` slot as `let:row`.
   * @type {Row}
   */
  export let row;

  /**
   * Specify the cell being edited.
   * Provided by the `cell` slot as `let:cell`.
   * @type {import("./DataTable.svelte").DataTableCell<Row>}
   */
  export let cell;

  /**
   * Provide a validation function for the bound value.
   * Return an error message to mark the cell invalid, or
   * `undefined` (or an empty string) when the value is valid.
   * The returned message is exposed via `let:invalidText`.
   * @type {(value: any, row: Row) => string | undefined}
   */
  export let validate = undefined;

  import { getContext, onDestroy, onMount } from "svelte";
  import { resolvePath } from "./data-table-utils.js";

  const ctx = getContext("carbon:DataTable") ?? {};
  const cellId = `${row?.id}:${cell?.key}`;
  const baseline = ctx.editableBaseline;

  let initialValue;
  let mounted = false;
  let seenBaseline = 0;
  let dirty = false;
  /** @type {string | undefined} */
  let invalidText = undefined;

  $: invalid = invalidText !== undefined && invalidText !== "";

  // `resetDirty()` on the table bumps the baseline; re-snapshot the current
  // value as pristine so an edited-then-saved cell stops reporting dirty.
  $: if (mounted && baseline && $baseline !== seenBaseline) {
    seenBaseline = $baseline;
    initialValue = resolvePath(row, cell.key);
    dirty = false;
    ctx.editableUpdate?.(cellId, { dirty, invalidText });
  }

  function report(value, markDirty) {
    if (markDirty) dirty = !Object.is(value, initialValue);
    invalidText = validate ? validate(value, row) : undefined;
    ctx.editableUpdate?.(cellId, { dirty, invalidText });
  }

  // A bound Carbon input writes `row[cell.key]` before this bubbled event
  // reaches the wrapper, so the row already holds the edited value here.
  function handleEdit() {
    const value = resolvePath(row, cell.key);
    // Re-derive `display` columns and sort keys that read this row,
    // so the consumer never has to call `refreshRow` by hand.
    ctx.refreshRow?.(row.id);
    report(value, true);
  }

  onMount(() => {
    initialValue = resolvePath(row, cell.key);
    mounted = true;
    ctx.editableRegister?.(cellId);
    // Seed the validity rollup from the initial value (e.g. a required
    // field that starts empty should make the table invalid immediately).
    report(initialValue, false);
  });

  onDestroy(() => {
    ctx.editableUnregister?.(cellId);
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--editable-cell={true}
  class:bx--editable-cell--dirty={dirty}
  class:bx--editable-cell--invalid={invalid}
  on:input={handleEdit}
  on:change={handleEdit}
  {...$$restProps}
>
  <slot {invalid} {invalidText} />
</div>

<style>
  .bx--editable-cell {
    position: relative;
  }

  /* Compact in-cell inputs: drop the form-item top margin so the row
     height stays tight when an input is always rendered in the cell. */
  .bx--editable-cell :global(.bx--form-item) {
    margin: 0;
  }

  /* Dirty marker: a subtle accent on the leading edge of the cell. */
  .bx--editable-cell--dirty::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: 2px;
    background-color: var(--cds-interactive-04, #0f62fe);
  }
</style>
