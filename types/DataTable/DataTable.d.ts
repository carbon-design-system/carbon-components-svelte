/// <reference types="svelte" />

type Key = string;

type Value = any;

interface EmptyHeader {
  key: Key;
  empty: boolean;
  display?: (item: Value) => Value;
  sort?: (a: Value, b: Value) => 0 | -1 | 1;
  columnMenu?: boolean;
}

interface NonEmptyHeader {
  key: Key;
  value: Value;
  display?: (item: Value) => Value;
  sort?: (a: Value, b: Value) => 0 | -1 | 1;
  columnMenu?: boolean;
}

type DataTableHeader = NonEmptyHeader | EmptyHeader;

type Row = Record<Key, Value>;

type RowId = string;

interface Cell {
  key: Key;
  value: Value;
}

export interface DataTableProps {
  /**
   * Specify the data table headers
   * @default []
   */
  headers?: DataTableHeader[];

  /**
   * Specify the rows the data table should render
   * keys defined in `headers` are used for the row ids
   * @default []
   */
  rows?: Row[];

  /**
   * Set the size of the data table
   */
  size?: "compact" | "short" | "tall";

  /**
   * Specify the title of the data table
   * @default ""
   */
  title?: string;

  /**
   * Specify the description of the data table
   * @default ""
   */
  description?: string;

  /**
   * Set to `true` to use zebra styles
   * @default false
   */
  zebra?: boolean;

  /**
   * Set to `true` for the sortable variant
   * @default false
   */
  sortable?: boolean;

  /**
   * Set to `true` for the expandable variant
   * Automatically set to `true` if `batchExpansion` is `true`
   * @default false
   */
  expandable?: boolean;

  /**
   * Set to `true` to enable batch expansion
   * @default false
   */
  batchExpansion?: boolean;

  /**
   * Specify the row ids to be expanded
   * @default []
   */
  expandedRowIds?: RowId[];

  /**
   * Set to `true` for the radio selection variant
   * @default false
   */
  radio?: boolean;

  /**
   * Set to `true` for the selectable variant
   * Automatically set to `true` if `radio` or `batchSelection` are `true`
   * @default false
   */
  selectable?: boolean;

  /**
   * Set to `true` to enable batch selection
   * @default false
   */
  batchSelection?: boolean;

  /**
   * Specify the row ids to be selected
   * @default []
   */
  selectedRowIds?: RowId[];

  /**
   * Set to `true` to enable a sticky header
   * @default false
   */
  stickyHeader?: boolean;
}

export default class DataTable {
  $$prop_def: DataTableProps;
  $$slot_def: {
    default: {};
    cell: { row: Row; cell: Cell };
    ["cell-header"]: { header: NonEmptyHeader };
    ["expanded-row"]: { row: Row };
  };

  $on(
    eventname: "click",
    cb: (event: CustomEvent<{ header?: DataTableHeader; row?: Row; cell?: Cell }>) => void
  ): () => void;
  $on(eventname: "click:header--expand", cb: (event: CustomEvent<{ expanded: boolean }>) => void): () => void;
  $on(
    eventname: "click:header",
    cb: (event: CustomEvent<{ header: DataTableHeader; sortDirection: "ascending" | "descending" | "none" }>) => void
  ): () => void;
  $on(eventname: "click:row", cb: (event: CustomEvent<Row>) => void): () => void;
  $on(eventname: "mouseenter:row", cb: (event: CustomEvent<Row>) => void): () => void;
  $on(eventname: "mouseleave:row", cb: (event: CustomEvent<Row>) => void): () => void;
  $on(eventname: "click:row--expand", cb: (event: CustomEvent<{ expanded: boolean; row: Row }>) => void): () => void;
  $on(eventname: "click:cell", cb: (event: CustomEvent<Cell>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
