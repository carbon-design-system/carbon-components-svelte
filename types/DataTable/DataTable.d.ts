/// <reference types="svelte" />

interface Header {
  key: string;
  value: string;
  display?: (item) => string;
  sort?: (a, b) => number;
  empty?: boolean;
  columnMenu?: boolean;
}

type Headers = Header[];

export default class DataTable {
  $$prop_def: {
    /**
     * Specify the data table headers
     * @default []
     */
    headers?: Headers;

    /**
     * Specify the rows the data table should render
     * keys defined in `headers` are used for the row ids
     * @default []
     */
    rows?: Object[];

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
    expandedRowIds?: string[];

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
    selectedRowIds?: string[];

    /**
     * Set to `true` to enable a sticky header
     * @default false
     */
    stickyHeader?: boolean;
  };

  $$slot_def: {
    default: {};
    ["expanded-row"]: { row: Object };
    ["cell-header"]: { header: Header };
    cell: { row: Object; cell: Object };
  };

  $on(
    eventname: "click",
    cb: (event: CustomEvent<{ header?: Header; row?: Object; cell?: Object }>) => void
  ): () => void;
  $on(eventname: "click:header--expand", cb: (event: CustomEvent<{ expanded: boolean }>) => void): () => void;
  $on(
    eventname: "click:header",
    cb: (event: CustomEvent<{ header: Header; sortDirection: "ascending" | "descending" | "none" }>) => void
  ): () => void;
  $on(eventname: "click:row", cb: (event: CustomEvent<Object>) => void): () => void;
  $on(eventname: "mouseenter:row", cb: (event: CustomEvent<Object>) => void): () => void;
  $on(eventname: "mouseleave:row", cb: (event: CustomEvent<Object>) => void): () => void;
  $on(eventname: "click:row--expand", cb: (event: CustomEvent<{ expanded: boolean; row: Object }>) => void): () => void;
  $on(eventname: "click:cell", cb: (event: CustomEvent<Object>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
