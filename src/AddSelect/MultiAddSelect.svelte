<script>
  /**
   * @extendProps {"./AddSelect.svelte"} AddSelectProps
   * @event {{ value: (string | number)[]; items: import("./AddSelect.svelte").AddSelectItem[] }} change - Fires when the draft selection changes, before it is confirmed.
   * @event {{ value: (string | number)[]; items: import("./AddSelect.svelte").AddSelectItem[] }} confirm - Fires when the selection is confirmed.
   * @event {null} cancel - Fires when the draft is thrown away and the selection goes back to `value`.
   * @event {{ path: import("./AddSelect.svelte").AddSelectCrumb[] }} navigate - Fires when the level changes.
   * @event {{ item: import("./AddSelect.svelte").AddSelectItem }} details - Fires when the details of a row are shown.
   * @slot {{ item: import("./AddSelect.svelte").AddSelectItem; selected: boolean }} item - Replaces the text of a row.
   * @slot {{ item: import("./AddSelect.svelte").AddSelectItem }} details - Details of an item. A row then has a "View details" action.
   * @slot {{ query: string }} empty - Shown when a level has no items.
   * @slot {{ query: string }} noResults - Shown when a search or a filter matches nothing.
   */

  /**
   * @typedef {import("./AddSelect.svelte").AddSelectItem} AddSelectItem
   * @typedef {import("./AddSelect.svelte").AddSelectCrumb} AddSelectCrumb
   */

  /**
   * The chosen keys. It follows the confirmed selection: the draft in the
   * panel only becomes `value` on confirm (or at once with
   * `commit="change"`).
   * @type {(string | number)[]}
   * @bindable writable
   */
  export let value = [];

  /**
   * The chosen items, resolved. Pass the items for the initial `value` when
   * they are not in the first page. It updates when the selection is
   * confirmed.
   * @type {AddSelectItem[]}
   * @bindable writable
   */
  export let selectedItems = [];

  /**
   * The levels opened, outermost first. An empty array is the top level.
   * @type {AddSelectCrumb[]}
   * @bindable writable
   */
  export let path = [];

  /**
   * The search text.
   * @bindable writable
   */
  export let query = "";

  /**
   * The chosen options of each filter, by filter id.
   * @type {Record<string, string[]>}
   * @bindable writable
   */
  export let filterValue = {};

  /**
   * Obtain a reference to the list element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let listRef = null;

  import AddSelect from "./AddSelect.svelte";

  /** @type {AddSelect} */
  let inner;

  /** Confirm the draft: it becomes `value` and `selectedItems`. */
  export function confirm() {
    inner.confirm();
  }

  /** Throw the draft away and go back to `value`. */
  export function reset() {
    inner.reset();
  }
</script>

<AddSelect
  bind:this={inner}
  multiple
  bind:value
  bind:selectedItems
  bind:path
  bind:query
  bind:filterValue
  bind:listRef
  slotsUsed={{
    item: Boolean($$slots.item),
    details: Boolean($$slots.details),
    empty: Boolean($$slots.empty),
    noResults: Boolean($$slots.noResults),
  }}
  {...$$restProps}
  on:change
  on:confirm
  on:cancel
  on:navigate
  on:details
>
  <svelte:fragment slot="item" let:item let:selected>
    <slot name="item" {item} {selected} />
  </svelte:fragment>
  <svelte:fragment slot="details" let:item>
    <slot name="details" {item} />
  </svelte:fragment>
  <svelte:fragment slot="empty" let:query>
    <slot name="empty" {query} />
  </svelte:fragment>
  <svelte:fragment slot="noResults" let:query>
    <slot name="noResults" {query} />
  </svelte:fragment>
</AddSelect>
