<script>
  /**
   * The list view of `FileManager`: a `DataTable` with one row per entry.
   * Internal: the parent owns the selection and the cursor and handles keys,
   * drags and clicks. `fileRows` adds what DataTable lacks on a row.
   */

  /** @type {ReadonlyArray<import("./file-manager-types.js").FileRow>} */
  export let rows = [];

  /** @type {ReadonlyArray<string>} */
  export let selectedIds = [];

  /** @type {"name" | "size" | "modified" | "owner"} */
  export let sortKey = "name";

  /** @type {"ascending" | "descending" | "none"} */
  export let sortDirection = "ascending";

  export let cursorId = "";
  export let renamingId = "";
  export let labelText = "";

  /** Set the id of the table, from which its inner ids derive. */
  export let id = "file-manager-table";

  /** Height of the table, header included, in pixels. */
  export let height = 400;

  /** @type {(entry: import("./file-manager-types.js").FileRow) => any} */
  export let iconFor;

  /** @type {import("./texts.js").FileManagerTexts} */
  export let texts;

  /** @type {(name: string, entry: import("./file-manager-types.js").FileRow) => "empty" | "slash" | "dots" | "exists" | null} */
  export let validate;

  /** @type {string | undefined} */
  export let locale = undefined;

  /**
   * The element around the table.
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import DataTable from "../DataTable/DataTable.svelte";
  import { formatFileSize } from "../utils/format-file-size.js";
  import FileManagerRename from "./FileManagerRename.svelte";
  import { fileRows } from "./file-rows.js";

  const dispatch = createEventDispatcher();

  // The rows arrive in their final order, folders first, so a header's own
  // comparison must not reorder them. A comparator that returns 0 leaves the
  // order alone, since the sort is stable.
  const keep = () => 0;

  // Two lines of 32px: the sticky header and the first row.
  const ROW_HEIGHT = 32;
  const HEADER_HEIGHT = 32;

  /** @type {Map<string, number>} */
  let indexById = new Map();

  /** @param {ReadonlyArray<{ id: string }>} list */
  function indexRows(list) {
    const map = new Map();
    for (let i = 0; i < list.length; i++) map.set(list[i].id, i);
    return map;
  }

  /** @type {Intl.DateTimeFormat | undefined} */
  let dateFormat;
  /**
   * @param {number | undefined} value
   * @param {string | undefined} formatLocale
   */
  function formatDate(value, formatLocale) {
    if (value === undefined) return "";
    dateFormat ??= new Intl.DateTimeFormat(formatLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return dateFormat.format(value);
  }

  /** @param {string | undefined} next */
  function resetFormat(next) {
    dateFormat = undefined;
    return next;
  }

  /** @param {string} id */
  function indexOf(id) {
    return indexById.get(id) ?? -1;
  }

  /**
   * Scroll so the row at `index` is in view. Rows outside the window are not
   * in the DOM, so this works from the row's offset.
   * @param {number} index
   */
  export function scrollToIndex(index) {
    const scroller = ref?.querySelector(".bx--data-table_inner-container");
    if (!scroller || index < 0) return;
    const top = index * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;
    const view = scroller.clientHeight - HEADER_HEIGHT;
    if (top < scroller.scrollTop) scroller.scrollTop = top;
    else if (bottom > scroller.scrollTop + view) {
      scroller.scrollTop = bottom - view;
    }
  }

  /** @type {Array<import("../DataTable/DataTable.svelte").DataTableNonEmptyHeader<import("./file-manager-types.js").FileRow>>} */
  $: headers = [
    { key: "name", value: texts.columnName, sort: keep },
    { key: "size", value: texts.columnSize, sort: keep },
    { key: "modified", value: texts.columnModified, sort: keep },
    { key: "owner", value: texts.columnOwner, sort: keep },
  ];
  $: tableHeight = Math.max(height, HEADER_HEIGHT + ROW_HEIGHT);
  $: indexById = indexRows(rows);
  $: formatLocale = resetFormat(locale);
</script>

<div
  bind:this={ref}
  class:bx--file-manager__list={true}
  data-file-host="list"
  use:fileRows={{
    selected: selectedIds,
    cursor: cursorId,
    draggable: renamingId === "",
    indexOf,
    count: rows.length,
  }}
>
  <DataTable
    {id}
    {headers}
    {rows}
    size="short"
    selectable
    sortable
    stickyHeader
    stickyHeaderMaxHeight={tableHeight}
    sortAlways
    virtualize={{
      itemHeight: ROW_HEIGHT,
      containerHeight: tableHeight,
      overscan: 6,
      threshold: 60,
    }}
    aria-label={labelText}
    bind:selectedRowIds={selectedIds}
    bind:sortKey
    bind:sortDirection
  >
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === "name"}
        <span class:bx--file-manager__name={true}>
          <span class:bx--file-manager__name-icon={true}>
            <svelte:component this={iconFor(row)} size={20} />
          </span>
          {#if renamingId === row.id}
            <FileManagerRename
              entry={row}
              {texts}
              {validate}
              on:save={(event) =>
                dispatch("rename:save", {
                  entry: row,
                  name: event.detail.name,
                })}
              on:cancel={() => dispatch("rename:cancel", { entry: row })}
            />
          {:else}
            <span class:bx--file-manager__name-text={true}>{row.name}</span>
          {/if}
        </span>
      {:else if cell.key === "size"}
        {row.kind === "folder" || row.size === undefined
          ? "—"
          : formatFileSize(row.size, { locale: formatLocale })}
      {:else if cell.key === "modified"}
        {formatDate(row.modified, formatLocale)}
      {:else}
        {row.owner ?? ""}
      {/if}
    </svelte:fragment>
  </DataTable>
</div>
