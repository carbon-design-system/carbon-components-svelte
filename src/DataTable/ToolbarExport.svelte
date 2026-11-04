<script>
  /**
   * @template {import("./DataTable.svelte").DataTableRow} [Row=import("./DataTable.svelte").DataTableRow]
   * @restProps {button}
   */

  /**
   * @event {{ format: "csv" | "tsv" | "json"; filename: string; rowScope: "filtered" | "page" | "selected"; rows: ReadonlyArray<Row> }} export - Dispatched when a format is chosen, before anything is serialized. The event is cancelable: call `preventDefault()` to skip serializing and downloading, for example to request the file from a server using `detail.format` and `detail.rowScope`.
   * @property {"csv" | "tsv" | "json"} format - The chosen format.
   * @property {string} filename - The file name, with its extension.
   * @property {"filtered" | "page" | "selected"} rowScope - The rows scope the export was taken with.
   * @property {ReadonlyArray<Row>} rows - The rows to export.
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * Specify the formats to offer, one menu item each.
   * @type {ReadonlyArray<"csv" | "tsv" | "json">}
   */
  export let formats = ["csv", "json"];

  /**
   * Specify which rows to export.
   * `"filtered"` exports every row that matches the search, across pages, in
   * the order the table shows them. `"page"` exports the rows on the current
   * page. `"selected"` exports the selected rows that match the search, in
   * the order the table shows them.
   * Ignored when `rows` is set.
   * @type {"filtered" | "page" | "selected"}
   */
  export let rowScope = "filtered";

  /**
   * Specify the file name. The extension of the chosen format is added.
   */
  export let filename = "export";

  /**
   * Specify the rows to export, instead of taking them from the table by
   * `rowScope`. Required outside a `DataTable`.
   * @type {ReadonlyArray<Row> | undefined}
   */
  export let rows = undefined;

  /**
   * Specify the headers to export, instead of the table's.
   * Required outside a `DataTable`.
   * @type {ReadonlyArray<import("./DataTable.svelte").DataTableHeader<Row>> | undefined}
   */
  export let headers = undefined;

  /**
   * Set to `true` to start csv and tsv files with a UTF-8 byte order mark,
   * which Excel needs to read non-ASCII text.
   */
  export let bom = false;

  /**
   * Specify options for the csv and tsv serializer.
   * @type {import("./data-table-utils.js").ToCsvOptions}
   */
  export let csvOptions = {};

  /**
   * Specify the menu item label for a format.
   * @type {(format: "csv" | "tsv" | "json") => string}
   */
  export let formatLabel = defaultFormatLabel;

  /** Specify the trigger's accessible label and the menu's label. */
  export let labelText = "Export";

  /**
   * Set to `false` to render a text trigger, for example inside
   * `ToolbarBatchActions`, where an icon-only toolbar action does not match
   * the batch bar's buttons.
   */
  export let iconOnly = true;

  /**
   * Specify the menu alignment relative to the trigger.
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Obtain a reference to the trigger HTML element.
   * @type {null | HTMLButtonElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuButton from "../MenuButton/MenuButton.svelte";
  import { MENU_SIZE_BY_TOOLBAR_SIZE } from "../constants/sizes.js";
  import Download from "../icons/Download.svelte";
  import { downloadFile } from "../utils/download-file.js";
  import { serializeRows, withExtension } from "./data-table-utils.js";

  /** @param {"csv" | "tsv" | "json"} format */
  function defaultFormatLabel(format) {
    return `Export ${format.toUpperCase()}`;
  }

  const dispatch = createEventDispatcher();
  const toolbarCtx = getContext("carbon:Toolbar") ?? {};
  const toolbarSize = toolbarCtx.toolbarSize;
  const tableCtx = getContext("carbon:DataTable");

  /** @type {Record<string, "xs" | "sm" | "md" | "lg">} */
  const menuSizes = MENU_SIZE_BY_TOOLBAR_SIZE;

  $: menuSize = menuSizes[$toolbarSize ?? "default"] ?? "lg";

  /**
   * The table's rows are read when asked, so nothing is tracked while the
   * menu is closed.
   * @param {typeof rowScope} rowScope
   * @param {typeof rows} rows
   */
  function resolveRows(rowScope, rows) {
    return rows ?? tableCtx?.getExportRows(rowScope) ?? [];
  }

  /** @param {typeof headers} headers */
  function resolveHeaders(headers) {
    return headers ?? tableCtx?.getExportHeaders() ?? [];
  }

  let rowCount = 0;
  $: if (open) rowCount = resolveRows(rowScope, rows).length;

  /** @param {"csv" | "tsv" | "json"} format */
  function handleExport(format) {
    const exportRows = resolveRows(rowScope, rows);
    const name = withExtension(filename, format);
    const proceed = dispatch(
      "export",
      { format, filename: name, rowScope, rows: exportRows },
      { cancelable: true },
    );
    if (!proceed) return;
    const { content, mimeType } = serializeRows(
      resolveHeaders(headers),
      exportRows,
      format,
      { bom, csv: csvOptions },
    );
    downloadFile(content, name, mimeType);
  }
</script>

<MenuButton
  bind:ref
  bind:open
  {iconOnly}
  icon={Download}
  size={menuSize}
  {labelText}
  intrinsicAlign={align}
  {...$$restProps}
  class={[iconOnly && "bx--toolbar-action", $$restProps.class]
    .filter(Boolean)
    .join(" ")}
  on:close
>
  {#each formats as format (format)}
    <MenuItem
      labelText={formatLabel(format)}
      disabled={rowCount === 0}
      on:click={() => handleExport(format)}
    />
  {/each}
</MenuButton>
