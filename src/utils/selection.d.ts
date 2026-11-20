export type SelectionKey = string | number;

export interface SelectionState<Key extends SelectionKey = SelectionKey> {
  /** Selected keys, in the order they were added. */
  selected: ReadonlySet<Key>;
  /** Where a Shift range starts. */
  anchor: Key | null;
  /** The key the cursor is on. Moving it never changes `selected`. */
  focus: Key | null;
  /** Tree only: parents with some, not all, descendants selected. */
  indeterminate: ReadonlySet<Key>;
}

export interface TreeSelectionNode<Key extends SelectionKey = SelectionKey> {
  id: Key;
  disabled?: boolean;
  nodes?: ReadonlyArray<TreeSelectionNode<Key>>;
}

export interface SelectionContext<Key extends SelectionKey = SelectionKey> {
  /**
   * Every key in the order it is shown. Ranges and arrow keys walk it.
   * Treat it as immutable: pass a new array when the order changes.
   */
  order: ReadonlyArray<Key>;
  /** @default "multiple" */
  mode?: "single" | "multiple";
  /**
   * The keys select all covers. Defaults to `order`. A table that pages
   * passes every filtered row, not the page.
   */
  scope?: ReadonlyArray<Key>;
  /** A disabled key is never selected by a range, select all, or an arrow step. */
  isDisabled?: (key: Key) => boolean;
  /**
   * Where the anchor goes after a Shift range. `"keep"` holds it, so the
   * opposite direction shrinks the range. `"move"` sets it to the clicked
   * key, so ranges chain.
   * @default "keep"
   */
  anchorOnRange?: "keep" | "move";
  /** Replace the linear range, for a grid that selects a rectangle. */
  range?: (from: Key, to: Key, order: ReadonlyArray<Key>) => Key[] | null;
  /**
   * Single mode: toggling the selected key clears it.
   * @default false
   */
  allowDeselect?: boolean;
  /** Selecting a parent selects its descendants. */
  tree?: { nodes: ReadonlyArray<TreeSelectionNode<Key>>; cascade?: boolean };
}

export type SelectionLevel = "none" | "some" | "all";

export interface SelectionSummary {
  state: SelectionLevel;
  checked: boolean;
  indeterminate: boolean;
  /** Selected keys in scope. */
  count: number;
  /** Selectable keys in scope. */
  total: number;
  /** Every selected key, in scope or not. */
  size: number;
  /** Selected keys outside the scope. */
  hidden: number;
}

export interface SelectionModifiers {
  shift?: boolean;
  /** Cmd or Ctrl. */
  toggle?: boolean;
}

export interface SelectionKeyOptions {
  /** A plain arrow key selects what it focuses. @default false */
  followFocus?: boolean;
  /** @default "vertical" */
  axis?: "vertical" | "horizontal" | "both";
  /**
   * Shift+arrow extends the range from the anchor, or toggles the key it
   * lands on.
   * @default "range"
   */
  shiftArrow?: "range" | "toggle";
  /** Swap Left and Right on the horizontal axis. */
  rtl?: boolean;
  wrap?: boolean;
  /** Page Up and Page Down step by this many; unhandled when unset. */
  pageSize?: number;
  /** @default true */
  skipDisabled?: boolean;
  /** Enter selects the focused key (single mode always does). */
  enterSelects?: boolean;
  /** Pick the next key yourself. `undefined` falls back to the default step. */
  move?: (
    focus: SelectionKey | null,
    event: { key: string },
  ) => SelectionKey | null | undefined;
}

export interface SelectionKeyResult<Key extends SelectionKey = SelectionKey> {
  state: SelectionState<Key>;
  /** Call `preventDefault`. */
  handled: boolean;
  /** Where the DOM focus should go, if it moved. */
  focus: Key | null;
  /** What changed the selection, for an announcement. */
  intent: "select" | "all" | "clear" | null;
}

export function indexOfKey<Key extends SelectionKey>(
  order: ReadonlyArray<Key>,
  key: Key | null | undefined,
): number;

export function createSelectionState<Key extends SelectionKey = SelectionKey>(
  selected?: Iterable<Key>,
  anchor?: Key | null,
  focus?: Key | null,
): SelectionState<Key>;

/** Move the cursor. The selection does not change. */
export function moveFocus<Key extends SelectionKey>(
  state: SelectionState<Key>,
  key: Key | null,
): SelectionState<Key>;

/** Select `key` alone. In a tree, its descendants come with it. */
export function selectKey<Key extends SelectionKey>(
  state: SelectionState<Key>,
  key: Key,
  ctx: SelectionContext<Key>,
): SelectionState<Key>;

/** Flip `key`, or set it with `force`. */
export function toggleKey<Key extends SelectionKey>(
  state: SelectionState<Key>,
  key: Key,
  ctx: SelectionContext<Key>,
  force?: boolean,
): SelectionState<Key>;

/** The keys between `anchor` and `key`, minus disabled ones, or `null`. */
export function rangeKeys<Key extends SelectionKey>(
  anchor: Key | null,
  key: Key,
  ctx: SelectionContext<Key>,
): Key[] | null;

/**
 * Select the range from the anchor to `key` over the current order.
 * `"replace"` makes the range the selection, `"add"` joins it, `"remove"`
 * takes it out.
 */
export function extendTo<Key extends SelectionKey>(
  state: SelectionState<Key>,
  key: Key,
  ctx: SelectionContext<Key>,
  how?: "replace" | "add" | "remove",
): SelectionState<Key>;

export function selectAll<Key extends SelectionKey>(
  state: SelectionState<Key>,
  ctx: SelectionContext<Key>,
  scope?: ReadonlyArray<Key>,
): SelectionState<Key>;

export function deselectScope<Key extends SelectionKey>(
  state: SelectionState<Key>,
  ctx: SelectionContext<Key>,
  scope?: ReadonlyArray<Key>,
): SelectionState<Key>;

export function clearSelection<Key extends SelectionKey>(
  state: SelectionState<Key>,
): SelectionState<Key>;

export function summarizeSelection<Key extends SelectionKey>(
  state: Pick<SelectionState<Key>, "selected">,
  scope: ReadonlyArray<Key>,
  isDisabled?: (key: Key) => boolean,
): SelectionSummary;

export function toggleAll<Key extends SelectionKey>(
  state: SelectionState<Key>,
  ctx: SelectionContext<Key>,
  scope?: ReadonlyArray<Key>,
  partial?: "clear" | "all",
): SelectionState<Key>;

export function keyLevel<Key extends SelectionKey>(
  state: SelectionState<Key>,
  key: Key,
): SelectionLevel;

export function pruneSelection<Key extends SelectionKey>(
  state: SelectionState<Key>,
  present: { has(key: Key): boolean },
): SelectionState<Key>;

export function selectionModifiers(
  event: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean },
  modifier?: "either" | "platform",
): { shift: boolean; toggle: boolean };

export function applyClick<Key extends SelectionKey>(
  state: SelectionState<Key>,
  key: Key,
  modifiers: SelectionModifiers,
  ctx: SelectionContext<Key>,
): SelectionState<Key>;

export function applySelectionKey<Key extends SelectionKey>(
  state: SelectionState<Key>,
  event: {
    key: string;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
  },
  ctx: SelectionContext<Key> & SelectionKeyOptions,
): SelectionKeyResult<Key>;

export interface SelectionTexts {
  /** "3 selected". `hidden` counts selected keys outside the scope. */
  selected?: (count: number, hidden: number) => string;
  cleared?: () => string;
}

export interface CreateSelectionOptions<
  Key extends SelectionKey = SelectionKey,
  Item = Key,
> {
  /** @default "multiple" */
  mode?: "single" | "multiple";
  /**
   * The keys in the order shown, or items when `getKey` is set. A function
   * is read on every call.
   */
  keys?: ReadonlyArray<Item> | (() => ReadonlyArray<Item>);
  getKey?: (item: Item) => Key;
  /** Every key, for `selectAll("all")`. */
  allKeys?: ReadonlyArray<Key>;
  initial?: Iterable<Key>;
  /**
   * Keys that leave `keys` (a filter) stay selected, or are dropped.
   * @default "keep"
   */
  hidden?: "keep" | "drop";
  isDisabled?: (key: Key) => boolean;
  anchorOnRange?: "keep" | "move";
  range?: SelectionContext<Key>["range"];
  allowDeselect?: boolean;
  tree?: SelectionContext<Key>["tree"];
  /** @default "either" */
  modifier?: "either" | "platform";
  keyboard?: SelectionKeyOptions;
  /** The C2 `announce`, or any function that says a message. */
  announce?: (
    message: string,
    options?: { channel?: string; debounce?: number; dedupe?: boolean },
  ) => void;
  texts?: SelectionTexts;
  /** The announcer channel. */
  id?: string;
  /** @default 250 */
  announceDelay?: number;
}

export interface Selection<
  Key extends SelectionKey = SelectionKey,
  Item = Key,
> {
  subscribe(callback: (state: SelectionState<Key>) => void): () => void;
  get(): SelectionState<Key>;
  set(keys: Iterable<Key>): void;
  toArray(): Key[];
  isSelected(key: Key): boolean;
  select(key: Key): boolean;
  toggle(key: Key, force?: boolean): boolean;
  extendTo(key: Key, how?: "replace" | "add" | "remove"): boolean;
  selectAll(scope?: "order" | "all"): boolean;
  toggleAll(partial?: "clear" | "all"): boolean;
  clear(): boolean;
  moveFocus(key: Key | null): void;
  summary(): SelectionSummary;
  keyLevel(key: Key): SelectionLevel;
  setKeys(keys?: ReadonlyArray<Item>): void;
  setAllKeys(keys: ReadonlyArray<Key>): void;
  setTree(tree: SelectionContext<Key>["tree"]): void;
  onItemClick(
    event: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean },
    key: Key,
  ): boolean;
  onItemKeydown(event: KeyboardEvent): Key | null;
  onItemFocus(key: Key): void;
}

export function createSelection<
  Key extends SelectionKey = SelectionKey,
  Item = Key,
>(options?: CreateSelectionOptions<Key, Item>): Selection<Key, Item>;
