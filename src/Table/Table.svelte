<script>
  /**
   * @typedef {any} TableValue
   * @typedef {{ id: any; [key: string]: TableValue; }} TableRow
   * @typedef {object} TableHeader
   * @property {string} key
   * @property {TableValue} value
   * @property {boolean} [rowHeader] - Render this column as a row header (`<th scope="row">`) in the table body, both semantically and visually.
   * @property {"start" | "center" | "end"} [columnAlign] - Horizontal alignment of the column header and cells. Logical, so `end` is the right edge in LTR and the left edge in RTL. Defaults to `"start"`.
   * @property {string} [width] - Column width (e.g. `"20%"`, `"10rem"`). Setting `width` or `minWidth` on any header switches the table to `table-layout: fixed`.
   * @property {string} [minWidth] - Column minimum width.
   * @slot {{ header: TableHeader }} cellHeader
   * @slot {{ row: TableRow; header: TableHeader; rowIndex: number; cellIndex: number; }} cell
   * @restProps {table}
   */

  /**
   * Specify the headers the table should render.
   * @type {ReadonlyArray<TableHeader>}
   */
  export let headers = [];

  /**
   * Specify the rows the table should render.
   * Values are read from each row using the `key` defined in `headers`.
   * @type {ReadonlyArray<TableRow>}
   */
  export let rows = [];

  /**
   * Set the size of the table.
   * @type {"compact" | "short" | "medium" | "tall"}
   */
  export let size = undefined;

  import { formatHeaderWidth } from "../DataTable/data-table-utils.js";

  const alignStyles = {
    center: "text-align: center;",
    end: "text-align: end;",
  };

  function formatAlignStyle(columnAlign) {
    return alignStyles[columnAlign];
  }

  function formatHeaderStyle(header) {
    return [formatHeaderWidth(header), formatAlignStyle(header.columnAlign)]
      .filter(Boolean)
      .join(";");
  }

  $: hasCustomHeaderWidth = headers.some(
    (header) => header.width ?? header.minWidth,
  );
</script>

<div class:bx--simple-table-container={true}>
  <table
    class:bx--simple-table={true}
    class:bx--simple-table--compact={size === "compact"}
    class:bx--simple-table--short={size === "short"}
    class:bx--simple-table--tall={size === "tall"}
    {...$$restProps}
    style="{$$restProps.style ?? ''}{hasCustomHeaderWidth
      ? ' table-layout: fixed;'
      : ''}"
  >
    <thead>
      <tr>
        {#each headers as header (header.key)}
          <th class:bx--type-label-01={true} style={formatHeaderStyle(header)}>
            <slot name="cellHeader" {header}>{header.value}</slot>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, rowIndex (row.id)}
        <tr>
          {#each headers as header, cellIndex (header.key)}
            {#if header.rowHeader}
              <th
                scope="row"
                class:bx--type-label-01={true}
                style={formatAlignStyle(header.columnAlign)}
              >
                <slot name="cell" {row} {header} {rowIndex} {cellIndex}>
                  {row[header.key]}
                </slot>
              </th>
            {:else}
              <td
                class:bx--type-caption-01={true}
                class:bx--type-text-secondary={true}
                style={formatAlignStyle(header.columnAlign)}
              >
                <slot name="cell" {row} {header} {rowIndex} {cellIndex}>
                  {row[header.key]}
                </slot>
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
