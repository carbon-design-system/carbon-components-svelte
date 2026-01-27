import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type DataTableKey<Row = DataTableRow> =
  import("./DataTableTypes.d.ts").PropertyPath<Row>;

export type DataTableValue = any;

export type DataTableEmptyHeader<Row = DataTableRow> = {
  key: DataTableKey<Row> | (string & {});
  /** Whether the header is empty */ empty: boolean;
  display?: (item: DataTableValue, row: Row) => DataTableValue;
  sort?: false | ((a: DataTableValue, b: DataTableValue) => number);
  /** Whether the column menu is enabled */ columnMenu?: boolean;
  width?: string;
  minWidth?: string;
};

export type DataTableNonEmptyHeader<Row = DataTableRow> = {
  key: DataTableKey<Row>;
  value: DataTableValue;
  display?: (item: DataTableValue, row: Row) => DataTableValue;
  sort?: false | ((a: DataTableValue, b: DataTableValue) => number);
  /** Whether the column menu is enabled */ columnMenu?: boolean;
  width?: string;
  minWidth?: string;
};

export type DataTableHeader<Row = DataTableRow> =
  | DataTableNonEmptyHeader<Row>
  | DataTableEmptyHeader<Row>;

export interface DataTableRow<Id = any> {
  id: Id;
  [key: string]: DataTableValue;
}

export type DataTableCell<Row = DataTableRow> = {
  key: DataTableKey<Row> | (string & {});
  value: DataTableValue;
  display?: (item: DataTableValue, row: DataTableRow) => DataTableValue;
};

export type DataTableContext<Row extends DataTableRow = DataTableRow> = {
  batchSelectedIds: import("svelte/store").Writable<ReadonlyArray<Row["id"]>>;
  tableRows: import("svelte/store").Writable<ReadonlyArray<Row>>;
  resetSelectedRowIds: () => void;
  filterRows: (
    searchValue: string,
    customFilter?: (row: Row, value: string) => boolean,
  ) => ReadonlyArray<Row["id"]>;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props<Row extends DataTableRow = DataTableRow> = {
  /**
   * Specify the data table headers.
   * @default []
   */
  headers?: ReadonlyArray<DataTableHeader<Row>>;

  /**
   * Specify the rows the data table should render.
   * Keys defined in `headers` are used for the row ids.
   * @default []
   */
  rows?: ReadonlyArray<Row>;

  /**
   * Set the size of the data table.
   * @default undefined
   */
  size?: "compact" | "short" | "medium" | "tall";

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
   * Specify a name attribute for the input elements
   * in a selectable data table (radio or checkbox).
   * When the table is inside a form, this name will
   * be included in the form data on submit.
   * @default `ccs-${Math.random().toString(36)}`
   */
  inputName?: string;

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
   * Specify the header key to sort by.
   * @default null
   */
  sortKey?: DataTableKey<Row>;

  /**
   * Specify the sort direction.
   * @default "none"
   */
  sortDirection?: "none" | "ascending" | "descending";

  /**
   * Set to `true` for the expandable variant.
   * Automatically set to `true` if `batchExpansion` is `true`.
   * @default false
   */
  expandable?: boolean;

  /**
   * Set to `true` to enable batch expansion.
   * @default false
   */
  batchExpansion?: boolean;

  /**
   * Specify the row ids to be expanded.
   * @default []
   */
  expandedRowIds?: ReadonlyArray<Row["id"]>;

  /**
   * Specify the ids for rows that should not be expandable.
   * @default []
   */
  nonExpandableRowIds?: ReadonlyArray<Row["id"]>;

  /**
   * Set to `true` for the radio selection variant
   * @default false
   */
  radio?: boolean;

  /**
   * Set to `true` for the selectable variant.
   * Automatically set to `true` if `radio` or `batchSelection` are `true`.
   * @default false
   */
  selectable?: boolean;

  /**
   * Set to `true` to enable batch selection
   * @default false
   */
  batchSelection?: boolean;

  /**
   * Specify the row ids to be selected.
   * @default []
   */
  selectedRowIds?: ReadonlyArray<Row["id"]>;

  /**
   * Specify the ids of rows that should not be selectable.
   * @default []
   */
  nonSelectableRowIds?: ReadonlyArray<Row["id"]>;

  /**
   * Set to `true` to enable a sticky header
   * @default false
   */
  stickyHeader?: boolean;

  /**
   * Set to `true` to use static width
   * @default false
   */
  useStaticWidth?: boolean;

  /**
   * Specify the number of items to display in a page
   * @default 0
   */
  pageSize?: number;

  /**
   * Set to `number` to set current page
   * @default 0
   */
  page?: number;

  /**
   * Override the default table header translation ids.
   * @default undefined
   */
  tableHeaderTranslateWithId?: (
    id: import("./TableHeader.svelte").TableHeaderTranslationId,
  ) => string;

  cell?: (
    this: void,
    ...args: [
      {
        row: Row;
        cell: DataTableCell<Row>;
        rowIndex: number;
        cellIndex: number;
        rowSelected: boolean;
        rowExpanded: boolean;
      },
    ]
  ) => void;

  cellHeader?: (
    this: void,
    ...args: [{ header: DataTableNonEmptyHeader }]
  ) => void;

  descriptionChildren?: (
    this: void,
    ...args: [{ props: { class: "bx--data-table-header__description" } }]
  ) => void;

  "expanded-row"?: (
    this: void,
    ...args: [{ row: Row; rowSelected: boolean }]
  ) => void;

  titleChildren?: (
    this: void,
    ...args: [{ props: { class: "bx--data-table-header__title" } }]
  ) => void;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type DataTableProps<Row extends DataTableRow = DataTableRow> = Omit<
  $RestProps,
  keyof $Props<Row>
> &
  $Props<Row>;

export default class DataTable<
  Row extends DataTableRow = DataTableRow,
> extends SvelteComponentTyped<
  DataTableProps<Row>,
  {
    click: CustomEvent<{
      header?: DataTableHeader<Row>;
      row?: Row;
      cell?: DataTableCell<Row>;
    }>;
    "click:header--expand": CustomEvent<{ expanded: boolean }>;
    "click:header": CustomEvent<{
      header: DataTableHeader<Row>;
      sortDirection?: "ascending" | "descending" | "none";
      target: EventTarget;
      currentTarget: EventTarget;
    }>;
    "click:header--select": CustomEvent<{
      indeterminate: boolean;
      selected: boolean;
    }>;
    "click:row": CustomEvent<{
      row: Row;
      target: EventTarget;
      currentTarget: EventTarget;
    }>;
    "mouseenter:row": CustomEvent<Row>;
    "mouseleave:row": CustomEvent<Row>;
    "click:row--expand": CustomEvent<{ expanded: boolean; row: Row }>;
    "click:row--select": CustomEvent<{ selected: boolean; row: Row }>;
    "click:cell": CustomEvent<{
      cell: DataTableCell<Row>;
      target: EventTarget;
      currentTarget: EventTarget;
    }>;
  },
  {
    default: Record<string, never>;
    cell: {
      row: Row;
      cell: DataTableCell<Row>;
      rowIndex: number;
      cellIndex: number;
      rowSelected: boolean;
      rowExpanded: boolean;
    };
    cellHeader: { header: DataTableNonEmptyHeader };
    descriptionChildren: {
      props: { class: "bx--data-table-header__description" };
    };
    "expanded-row": { row: Row; rowSelected: boolean };
    titleChildren: { props: { class: "bx--data-table-header__title" } };
  }
> {}
