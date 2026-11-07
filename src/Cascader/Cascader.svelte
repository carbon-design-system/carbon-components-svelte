<script>
  /**
   * @template [Id=(string|number)]
   * @typedef {object} CascaderNode
   * @property {Id} id - Unique among its siblings. Two branches may reuse an id.
   * @property {string} text
   * @property {boolean} [disabled]
   * @property {boolean} [hasChildren] - Children not loaded yet. Opening the node calls `loadChildren`.
   * @property {CascaderNode<Id>[]} [nodes]
   */

  /**
   * @event change
   * @type {{ value: Array<CascaderNode["id"]>; nodes: CascaderNode[]; text: string } | { values: Array<Array<CascaderNode["id"]>>; paths: CascaderNode[][] }}
   */

  /**
   * @event {{ node: CascaderNode; nodes: ReadonlyArray<CascaderNode>; }} load
   * @event {{ node: CascaderNode; error: unknown; }} load:error
   * @event {KeyboardEvent | MouseEvent} clear
   * @event {{ trigger: "click" | "keydown" | "input" | "programmatic" }} open
   * @event {{ trigger: "escape-key" | "outside-click" | "select" | "tab" }} close
   * @slot {{ query: string }} empty
   * @restProps {button | input}
   */

  /**
   * Set the tree. A node's `nodes` are its children; a node with
   * `hasChildren` and no `nodes` loads them with `loadChildren`.
   * @type {ReadonlyArray<CascaderNode>}
   */
  export let nodes = [];

  /**
   * Specify the chosen path, as the ids from a root to the node, in single
   * mode. An empty array means nothing is chosen.
   * @type {Array<CascaderNode["id"]>}
   * @bindable writable
   */
  export let value = [];

  /**
   * Specify the chosen paths in `multiple` mode.
   * @type {Array<Array<CascaderNode["id"]>>}
   * @bindable writable
   */
  export let values = [];

  /**
   * Set to `true` to choose many paths with checkboxes. A parent shows a
   * mixed state when only some of its children are checked.
   */
  export let multiple = false;

  /**
   * In single mode, set to `true` to let a branch be chosen as well as a
   * leaf. By default only a leaf is chosen, and a branch only opens the next
   * column.
   */
  export let changeOnSelect = false;

  /**
   * In `multiple` mode, which checked nodes `values` lists. `"parent"` lists
   * a branch whose children are all checked as one path (its own). `"leaf"`
   * lists the leaves under it.
   * @type {"parent" | "leaf"}
   */
  export let showChecked = "parent";

  /**
   * Specify the text between the labels of a path.
   */
  export let separator = " / ";

  /**
   * Specify how a chosen path reads in the field. Receives the nodes from a
   * root to the chosen one. By default, their labels joined by `separator`.
   * @type {undefined | ((path: CascaderNode[]) => string)}
   */
  export let pathToString = undefined;

  /**
   * Specify how the columns lay out. `"auto"` shows columns side by side
   * and, below the `md` breakpoint, one column at a time with a way back.
   * @type {"auto" | "columns" | "drill-in"}
   */
  export let layout = "auto";

  /**
   * Load the children of a node with `hasChildren`. Receives the node and
   * the nodes from the root to it. Abort work when the `signal` aborts.
   * @type {undefined | ((node: CascaderNode, context: { signal: AbortSignal; path: CascaderNode[] }) => Promise<CascaderNode[]> | CascaderNode[])}
   */
  export let loadChildren = undefined;

  /**
   * Set to `true` to search across every level. The field becomes a text
   * input. Paths whose labels contain every word are listed, with the match
   * marked.
   */
  export let filterable = false;

  /**
   * Search somewhere else, such as on a server, for a tree that is not all
   * loaded. Receives the query and returns the matching paths, each a list of
   * nodes from a root. By default the loaded tree is searched.
   * @type {undefined | ((query: string, context: { signal: AbortSignal }) => Promise<CascaderNode[][]> | CascaderNode[][])}
   */
  export let search = undefined;

  /**
   * Wait this long (ms) after the last key before searching. Read once, when
   * the component is created. Default: 0 for the loaded tree, 200 with
   * `search`.
   * @type {number | undefined}
   */
  export let searchDebounce = undefined;

  /**
   * Specify the most results a search lists.
   */
  export let maxResults = 100;

  /**
   * Specify a label for each column, from the first. A column without one is
   * named by the node that opens it.
   * @type {string[]}
   */
  export let levelLabels = [];

  /**
   * Specify the size of the field.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the side of the field the menu opens on.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  export let disabled = false;

  export let labelText = "";

  /** Set to `true` to hide the label visually. */
  export let hideLabel = false;

  /**
   * Specify the text shown in the field while nothing is chosen.
   * @type {string | undefined}
   */
  export let label = undefined;

  /** Specify the placeholder of the search input. */
  export let placeholder = "";

  export let invalid = false;

  export let invalidText = "";

  export let warn = false;

  export let warnText = "";

  export let helperText = "";

  /** Set to `true` to use the read-only variant. */
  export let readonly = false;

  /** Specify the text read out for a read-only field. */
  export let readonlyText = "Read-only";

  /** Set to `true` to show a clear button in single mode. */
  export let clearable = false;

  /**
   * Set to `true` to render the menu in a portal, or `false` to keep it in
   * place. Left unset, it moves to a portal inside a `Modal` or when a box
   * around the field cuts it off.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /**
   * Specify the field's name. Each chosen path is submitted as a JSON array
   * of its ids.
   * @type {string | undefined}
   */
  export let name = undefined;

  /** @type {string | undefined} */
  export let form = undefined;

  /** Set to `true` to require a choice. */
  export let required = false;

  export let requiredInvalidText = "Choose an item";

  /** Specify the text shown when nothing matches. */
  export let emptyText = "No results";

  /** Specify the text shown while children or results load. */
  export let loadingText = "Loading...";

  /** Specify the label of the button that loads a failed node again. */
  export let retryText = "Try again";

  /**
   * Specify the label of the button that goes back a column when columns
   * show one at a time.
   * Receives the name of the column the button goes back to.
   * @type {(title: string) => string}
   */
  export let backText = function backText(title) {
    return `Back to ${title}`;
  };

  /**
   * Say that a node failed to load.
   * @type {(node: CascaderNode) => string}
   */
  export let loadErrorText = function loadErrorText(node) {
    return `Could not load ${node.text}`;
  };

  /**
   * Said when a path is chosen.
   * @type {(path: CascaderNode[]) => string}
   */
  export let selectedText = function selectedText(path) {
    const last = path[path.length - 1];
    const levels = path.length === 1 ? "level" : "levels";
    return `${last?.text ?? ""} selected, ${path.length} ${levels}`;
  };

  /**
   * Said when a search settles.
   * @type {(count: number, truncated: boolean) => string}
   */
  export let resultsText = function resultsText(count, truncated) {
    if (count === 0) return "No results";
    if (truncated) return `${count} or more results`;
    return count === 1 ? "1 result" : `${count} results`;
  };

  /**
   * Said when a column opens.
   * @type {(node: CascaderNode, count: number) => string}
   */
  export let columnText = function columnText(node, count) {
    return `${node.text}, ${count} ${count === 1 ? "item" : "items"}`;
  };

  /**
   * Said when the number of checked paths changes.
   * @type {(count: number) => string}
   */
  export let selectionCountText = function selectionCountText(count) {
    return `${count} selected`;
  };

  /** Said when the choice is cleared. */
  export let selectionClearedText = "Selection cleared";

  /**
   * Shown under a search that cut its list at `maxResults`.
   * @type {(shown: number) => string}
   */
  export let moreResultsText = function moreResultsText(shown) {
    return `Showing the first ${shown}. Type more to narrow the list.`;
  };

  /** Specify the text that names the clear button. */
  export let clearSelectionText = "Clear selected item";

  /**
   * Override the default screen reader text of the list box icons.
   * @type {undefined | ((id: "close" | "open") => string)}
   */
  export let translateWithId = undefined;

  /**
   * @type {undefined | ((id: "clearAll" | "clearSelection") => string)}
   */
  export let translateWithIdSelection = undefined;

  /** Specify an id for the field. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the field button.
   * @type {null | HTMLButtonElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Obtain a reference to the search input.
   * @type {null | HTMLInputElement}
   * @bindable readonly
   */
  export let inputRef = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import ListBoxMenuStatus from "../ListBox/ListBoxMenuStatus.svelte";
  import ListBoxRequiredInput from "../ListBox/ListBoxRequiredInput.svelte";
  import ListBoxSelection from "../ListBox/ListBoxSelection.svelte";
  import { ListBox, ListBoxField, ListBoxMenuIcon } from "../ListBox/index.js";
  import { MENU_PAGE_STEP } from "../ListBox/list-box-utils.js";
  import {
    createMenuCloseHandler,
    createMenuOpenHandler,
  } from "../ListBox/menu-status.js";
  import {
    FORM_SIZE_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { createAnnouncerChannel } from "../utils/announcer.js";
  import { createAsyncSource } from "../utils/async-source.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { clippedBy } from "../utils/fit-align.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import { menuSide } from "../utils/menu-placement.js";
  import { createOverlay } from "../utils/overlay-stack.js";
  import { createSelection } from "../utils/selection.js";
  import { createTextMatcher } from "../utils/text-match.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import CascaderMenu from "./CascaderMenu.svelte";
  import CascaderOption from "./CascaderOption.svelte";
  import {
    buildColumns,
    checkedPaths,
    joinLabels,
    needsLoad,
    pathKey,
    resolvePath,
    samePath,
    samePaths,
    searchPaths,
    toSelectionTree,
  } from "./cascader-model.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext(MODAL_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();
  $: effectiveSize = size ?? $formSize;

  /** @type {null | HTMLDivElement} */
  let wrapperRef = null;
  /** @type {null | HTMLDivElement} */
  let fieldRef = null;
  /** @type {null | HTMLDivElement} */
  let menuRef = null;
  let fieldFocused = false;
  let requiredError = false;
  let destroyed = false;

  /** Children `loadChildren` returned, by the key of the parent. */
  let loaded = /** @type {Map<string, ReadonlyArray<CascaderNode>>} */ (
    new Map()
  );
  /** The lazy nodes that are loading, or failed to. */
  let loadStates = /** @type {Map<string, "loading" | "error">} */ (new Map());
  /** The ids from the root to the deepest open column. */
  let trail = /** @type {Array<CascaderNode["id"]>} */ ([]);
  let cursorKey = /** @type {string | null} */ (null);
  let cursorOrigin = /** @type {"keyboard" | "pointer"} */ ("keyboard");
  /** The column shown while columns come one at a time. */
  let viewCol = 0;
  let searchIndex = 0;
  let query = "";
  let dirty = false;
  let inputText = "";
  /** Paths found by a search whose chain may not be loaded. */
  let known = /** @type {Map<string, CascaderNode[]>} */ (new Map());
  let narrow = false;

  const typeahead = createTypeaheadBuffer();
  const announcer = createAnnouncerChannel(() => wrapperRef);

  const { openMenu, sync: syncOpenEvent } = createMenuOpenHandler({
    getOpen: () => open,
    setOpen: (v) => (open = v),
    dispatch,
  });
  /** @type {(trigger: "escape-key" | "outside-click" | "select" | "tab") => void} */
  const close = createMenuCloseHandler({
    getOpen: () => open,
    setOpen: (v) => (open = v),
    dispatch,
  });

  const layer = createOverlay({
    kind: "cascader",
    element: () => menuRef,
    anchors: () => [wrapperRef],
    closeOnTab: true,
    onDismiss: (trigger) => {
      if (open) close(trigger);
    },
  });
  $: layer.sync(open);

  const selection = createSelection({
    mode: "multiple",
    tree: { nodes: [], cascade: true },
    initial: multiple ? values.map(pathKey) : [],
    announce: announcer.announce,
    texts: {
      selected: () => selectionCountText(checkedCount()),
      cleared: () => selectionClearedText,
    },
  });
  /**
   * How many paths the field lists. The model counts keys, every node under a
   * checked branch too, and the person checked what the field lists.
   * @returns {number}
   */
  function checkedCount() {
    return checkedPaths(nodes, loaded, selection.get().selected, showChecked)
      .length;
  }

  /** What `values` last held, so an outside write is told from our own. */
  let lastValues = values;

  onMount(() => {
    const release = announcer.connect();
    const media = window.matchMedia("(max-width: 41.98rem)");
    narrow = media.matches;
    /** @param {MediaQueryListEvent} event */
    const onMedia = (event) => {
      narrow = event.matches;
    };
    media.addEventListener("change", onMedia);
    return () => {
      destroyed = true;
      media.removeEventListener("change", onMedia);
      release();
      typeahead.clear();
      layer.close();
      for (const job of jobs.values()) {
        job.source.cancel();
        job.stop();
      }
      jobs.clear();
    };
  });

  $: single = !multiple;
  $: drill = layout === "drill-in" || (layout === "auto" && narrow);
  $: menuId = `menu-${id}`;
  $: ({ helperId, errorId, warnId, readonlyId } = buildFieldIds(id));
  $: selectionId = `selection-${id}`;
  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal || portalWhenClipped : portalMenu;
  $: sep = separator;

  // Set for one open when the in-place menu turns out to be cut off by a
  // box around it: the menu moves to a portal instead.
  let portalWhenClipped = false;
  $: if (!open) portalWhenClipped = false;
  /** @type {"top" | "bottom" | null} */
  let measuredSide = null;
  $: placement = measuredSide ?? direction;
  $: if (open && !effectivePortalMenu) {
    void direction;
    tick().then(placeMenu);
  } else {
    measuredSide = null;
  }

  async function placeMenu() {
    const anchor = filterable ? fieldRef : ref;
    if (!(open && menuRef && anchor)) return;
    const mayPortal = portalMenu === undefined;
    if (mayPortal && clippedBy(menuRef)) {
      portalWhenClipped = true;
      return;
    }
    const side = menuSide(anchor, menuRef, direction);
    if (side === placement) return;
    measuredSide = side;
    await tick();
    if (mayPortal && open && menuRef && clippedBy(menuRef)) {
      portalWhenClipped = true;
    }
  }

  // The tree the checks roll up in. Built for the loaded nodes, so a lazy
  // level that arrives joins it.
  $: selectionTree = multiple ? toSelectionTree(nodes, loaded) : [];
  $: if (multiple) {
    selection.setTree({ nodes: selectionTree, cascade: true });
  }
  $: checkedKeys = $selection.selected;
  $: partialKeys = $selection.indeterminate;

  // Outside writes to `values` are read once per change.
  $: syncValuesIn(values, multiple);

  /**
   * @param {Array<Array<CascaderNode["id"]>>} next
   * @param {boolean} on
   */
  function syncValuesIn(next, on) {
    if (!on || samePaths(next, lastValues)) return;
    lastValues = next;
    const chains = next.map((path) => ensurePath(path));
    selection.set(next.map(pathKey));
    if (loadChildren) {
      Promise.all(chains).then(() => {
        if (!destroyed && samePaths(values, lastValues)) {
          selection.set(values.map(pathKey));
        }
      });
    }
  }

  // Which nodes the field names.
  /** @type {CascaderNode[]} */
  let valueNodes = [];
  $: valueNodes = single ? pathNodes(value, nodes, loaded, known) : [];
  $: hasValue = single && value.length > 0;
  $: shownPaths = multiple
    ? checkedPaths(nodes, loaded, checkedKeys, showChecked)
    : [];
  $: displayText = multiple
    ? shownPaths
        .map((path) =>
          formatPath(pathNodes(path, nodes, loaded, known), pathToString, sep),
        )
        .filter(Boolean)
        .join(", ")
    : formatPath(valueNodes, pathToString, sep);
  $: selectionCount = multiple ? shownPaths.length : 0;
  $: hasSelection = multiple ? shownPaths.length > 0 : hasValue;
  $: valueKey = single ? pathKey(value) : "";
  $: formEntries = multiple
    ? shownPaths
    : hasValue
      ? [value]
      : /** @type {Array<Array<CascaderNode["id"]>>} */ ([]);

  /**
   * @param {ReadonlyArray<CascaderNode["id"]>} ids
   * @param {ReadonlyArray<CascaderNode>} tree
   * @param {Map<string, ReadonlyArray<CascaderNode>>} loadedChildren
   * @param {Map<string, CascaderNode[]>} found
   * @returns {CascaderNode[]}
   */
  function pathNodes(ids, tree, loadedChildren, found) {
    if (ids.length === 0) return [];
    const { nodes: resolved, complete } = resolvePath(
      tree,
      loadedChildren,
      ids,
    );
    if (complete) return resolved;
    return found.get(pathKey(ids)) ?? [];
  }

  /**
   * @param {CascaderNode[]} path
   * @param {undefined | ((path: CascaderNode[]) => string)} format
   * @param {string} between
   */
  function formatPath(path, format, between) {
    if (path.length === 0) return "";
    return format ? format(path) : joinLabels(path, between);
  }

  // Columns.
  /** @type {import("./cascader-model.js").CascaderColumn[]} */
  let columns = [];
  /** @type {Map<string, import("./cascader-model.js").CascaderEntry>} */
  let entryByKey = new Map();
  $: ({ columns, entryByKey } = buildColumns(nodes, loaded, trail, loadStates));
  $: shownCol = Math.min(viewCol, columns.length - 1);
  $: backTitle =
    shownCol > 0
      ? columns[shownCol - 1].parent?.text ||
        levelLabels[shownCol - 1] ||
        labelText
      : "";
  $: cursor = cursorKey === null ? undefined : entryByKey.get(cursorKey);
  $: trailKeys = new Set(
    trail.map((_, index) => pathKey(trail.slice(0, index + 1))),
  );

  // Search.
  const searchSource = createAsyncSource(
    /**
     * @param {string} text
     * @param {{ signal: AbortSignal }} context
     */
    async (text, context) => {
      if (search) {
        const found = await search(text, context);
        const match = createTextMatcher(text, { terms: "all" });
        const list = Array.isArray(found) ? found : [];
        return {
          truncated: list.length > maxResults,
          results: list.slice(0, maxResults).map((path) => {
            const joined = joinLabels(path, separator);
            return {
              ids: path.map((node) => node.id),
              nodes: path,
              key: pathKey(path.map((node) => node.id)),
              text: joined,
              ranges: match(joined),
            };
          }),
        };
      }
      return searchPaths(nodes, loaded, text, {
        separator,
        limit: maxResults,
        leafOnly: !(single && changeOnSelect),
      });
    },
    {
      debounce: searchDebounce ?? (search ? 200 : 0),
      keepPrevious: true,
      cache: false,
    },
  );

  $: searching = open && filterable && query.trim() !== "";
  $: syncSearch(searching, query);

  /**
   * @param {boolean} on
   * @param {string} text
   */
  function syncSearch(on, text) {
    if (on) searchSource.set(text);
    else if (searchSource.get().status !== "idle") searchSource.reset();
  }

  $: results = searching ? ($searchSource.data?.results ?? []) : [];
  $: truncated = searching && ($searchSource.data?.truncated ?? false);
  $: searchBusy = searching && $searchSource.status === "loading";
  $: searchFailed = searching && $searchSource.status === "error";
  let lastResults = /** @type {unknown} */ (null);
  $: if (results !== lastResults) {
    lastResults = results;
    searchIndex = 0;
  }
  $: if (searching && $searchSource.status === "success") {
    announcer.announce(resultsText(results.length, truncated), {
      debounce: 300,
      dedupe: true,
    });
  }

  // Ids the field points `aria-activedescendant` at.
  const ordinals = /** @type {Map<string, number>} */ (new Map());
  /** @param {string} key */
  function optionDomId(key) {
    let ordinal = ordinals.get(key);
    if (ordinal === undefined) {
      ordinal = ordinals.size;
      ordinals.set(key, ordinal);
    }
    return `${id}-o${ordinal}`;
  }

  $: highlightedKey = open
    ? searching
      ? results[searchIndex]?.key
      : cursor?.key
    : undefined;
  $: highlightedId = highlightedKey ? optionDomId(highlightedKey) : undefined;

  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || requiredError,
    warn,
    disabled,
    readonly,
  }));
  $: if (!required || hasSelection) requiredError = false;
  $: shownInvalidText =
    requiredError && !invalid ? requiredInvalidText : invalidText;
  $: canClear = !readonly && hasSelection && (multiple || clearable);
  $: statusDescribedById = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    helperText,
    invalidText: shownInvalidText,
    warnText,
    errorId: errorId ?? "",
    warnId: warnId ?? "",
    helperId,
  });
  $: fieldDescribedById = joinDescribedBy(
    readonly ? readonlyId : null,
    canClear ? selectionId : null,
    statusDescribedById,
    $$restProps["aria-describedby"],
  );
  $: menuAriaLabel = $$restProps["aria-label"] ?? (labelText || "Choose");

  $: if (!open) {
    dirty = false;
    query = "";
  }
  $: if (!dirty) inputText = multiple ? "" : displayText;
  $: busy = [...loadStates.values()].includes("loading");

  $: kindClass = multiple
    ? "bx--multi-select"
    : filterable
      ? "bx--combo-box"
      : "bx--dropdown";
  $: listBoxClass = [
    "bx--cascader",
    kindClass,
    multiple && filterable && "bx--combo-box",
    multiple && filterable && "bx--multi-select--filterable",
    !multiple && !filterable && showInvalid && "bx--dropdown--invalid",
    !multiple && !filterable && showWarn && "bx--dropdown--warning",
    !multiple && !filterable && open && "bx--dropdown--open",
    !multiple && !filterable && readonly && "bx--dropdown--readonly",
    !multiple && filterable && showWarn && "bx--combo-box--warning",
    !multiple && filterable && readonly && "bx--combo-box--readonly",
    multiple && showInvalid && "bx--multi-select--invalid",
    multiple && readonly && "bx--multi-select--readonly",
    multiple && selectionCount > 0 && "bx--multi-select--selected",
    placement === "top" && "bx--list-box--up",
    filterable && inputText && "bx--list-box--clearable",
    !filterable && canClear && single && "bx--list-box--clearable",
    !filterable && canClear && single && "bx--dropdown--clearable",
    open && highlightedId != null && "bx--list-box--option-highlighted",
    effectiveSize === "xs" && !multiple && !filterable && "bx--dropdown--xs",
    effectiveSize === "sm" && !multiple && !filterable && "bx--dropdown--sm",
    effectiveSize === "lg" && !multiple && !filterable && "bx--dropdown--lg",
    effectiveSize === "xl" && !multiple && !filterable && "bx--dropdown--xl",
    disabled && !multiple && !filterable && "bx--dropdown--disabled",
  ]
    .filter(Boolean)
    .join(" ");
  $: showFieldFocus = fieldFocused || open;

  // Opening: show the column that holds the chosen path, with the cursor on it.
  // The assignments are written out here, not in a helper, so Svelte 3 and 4
  // order the statements that read them after this one.
  let wasOpen = false;
  $: if (open !== wasOpen) {
    wasOpen = open;
    if (open) {
      const first = multiple ? values[0] : value;
      const chosen = first !== undefined && first.length > 0;
      trail = chosen ? first.slice(0, -1) : [];
      viewCol = trail.length;
      cursorKey = chosen ? pathKey(first) : null;
      cursorOrigin = "keyboard";
      if (chosen) revealChosen(first);
    } else {
      typeahead.clear();
      searchIndex = 0;
      for (const job of jobs.values()) job.source.cancel();
    }
  }

  /**
   * Load the chain of a chosen path that is lazy, then drop a cursor that
   * names a node that is not there.
   * @param {Array<CascaderNode["id"]>} ids
   */
  async function revealChosen(ids) {
    await ensurePath(ids);
    await tick();
    if (!open || destroyed) return;
    if (cursorKey !== null && !entryByKey.has(cursorKey)) cursorKey = null;
  }

  // The cursor starts on the first usable item of the column in view.
  $: if (open && !searching && cursorKey === null) {
    cursorKey =
      columns[Math.min(viewCol, columns.length - 1)]?.entries.find(
        (entry) => !entry.disabled,
      )?.key ?? null;
  }

  // Loading ---------------------------------------------------------------

  /**
   * @typedef {object} Job
   * @property {import("../utils/async-source.js").AsyncSource<ReadonlyArray<CascaderNode>, string>} source
   * @property {() => void} stop
   */
  const jobs = /** @type {Map<string, Job>} */ (new Map());

  /**
   * @param {string} key
   * @param {"loading" | "error" | null} state
   */
  function setLoadState(key, state) {
    if ((loadStates.get(key) ?? null) === state) return;
    const next = new Map(loadStates);
    if (state) next.set(key, state);
    else next.delete(key);
    loadStates = next;
  }

  /**
   * Load the children of a lazy node, once, and keep them.
   * @param {CascaderNode} node
   * @param {string} key
   * @param {CascaderNode[]} path
   * @returns {Promise<boolean>} Whether the children are loaded.
   */
  function loadNode(node, key, path) {
    if (loaded.has(key)) return Promise.resolve(true);
    if (!loadChildren) return Promise.resolve(false);
    const job = jobs.get(key) ?? createJob(node, key, path);
    return job.source.set(key).then(() => loaded.has(key));
  }

  /**
   * One source per lazy node: it owns that node's abort, status and retry.
   * @param {CascaderNode} node
   * @param {string} key
   * @param {CascaderNode[]} path
   * @returns {Job}
   */
  function createJob(node, key, path) {
    const source = createAsyncSource(
      /**
       * @param {string} _
       * @param {{ signal: AbortSignal }} context
       */
      async (_, context) => {
        const children = await loadChildren?.(node, {
          signal: context.signal,
          path,
        });
        return Array.isArray(children) ? children : [];
      },
      { cache: false, keepPrevious: false, key: () => key },
    );
    const stop = source.subscribe((state) => {
      if (destroyed) return;
      if (state.status === "loading") {
        setLoadState(key, "loading");
      } else if (state.status === "error") {
        setLoadState(key, "error");
        dispatch("load:error", { node, error: state.error });
        announcer.announce(loadErrorText(node), { politeness: "assertive" });
      } else if (state.status === "success" && state.data) {
        loaded = new Map(loaded).set(key, state.data);
        setLoadState(key, null);
        dispatch("load", { node, nodes: state.data });
        jobs.delete(key);
        queueMicrotask(stop);
      } else {
        setLoadState(key, null);
      }
    });
    /** @type {Job} */
    const job = { source, stop };
    jobs.set(key, job);
    return job;
  }

  /** @param {string} key */
  function retry(key) {
    const job = jobs.get(key);
    if (!job) return;
    job.source.refresh();
  }

  /**
   * Load every lazy parent along a path, in order.
   * @param {ReadonlyArray<CascaderNode["id"]>} ids
   * @returns {Promise<boolean>} Whether the whole path resolves.
   */
  async function ensurePath(ids) {
    for (let depth = 1; depth < ids.length; depth++) {
      if (destroyed) return false;
      const prefix = ids.slice(0, depth);
      const { nodes: resolved } = resolvePath(nodes, loaded, prefix);
      if (resolved.length < depth) return false;
      const node = resolved[depth - 1];
      const key = pathKey(prefix);
      if (needsLoad(node, key, loaded)) {
        // eslint-disable-next-line no-await-in-loop -- each level needs the one above it
        const ok = await loadNode(node, key, resolved);
        if (!ok) return false;
      }
    }
    return resolvePath(nodes, loaded, ids).complete;
  }

  $: if (single && value.length > 1 && loadChildren) ensurePath(value);

  // Opening a column ------------------------------------------------------

  /**
   * Open the column of `entry`. Loads its children when they are lazy.
   * @param {import("./cascader-model.js").CascaderEntry} entry
   * @param {boolean} enter - Put the cursor in the new column.
   */
  async function expand(entry, enter) {
    if (!entry.branch || entry.disabled) return;
    const opening = entry.key;
    for (const [key, job] of jobs) if (key !== opening) job.source.cancel();
    trail = entry.ids;
    viewCol = entry.col + 1;
    if (needsLoad(entry.node, entry.key, loaded)) {
      const path = resolvePath(nodes, loaded, entry.ids).nodes;
      const ok = await loadNode(entry.node, entry.key, path);
      if (!ok || destroyed || pathKey(trail) !== opening) return;
    }
    await tick();
    const column = columns[entry.col + 1];
    if (!column) return;
    announcer.announce(columnText(entry.node, column.entries.length), {
      debounce: 150,
    });
    if (enter) {
      const target = pickEntry(column, "chosen") ?? firstEnabled(column);
      if (target) setCursor(target.key, "keyboard");
    }
  }

  /**
   * @param {import("./cascader-model.js").CascaderColumn} column
   */
  function firstEnabled(column) {
    return column.entries.find((entry) => !entry.disabled);
  }

  /**
   * The entry of the chosen path in a column, if there is one.
   * @param {import("./cascader-model.js").CascaderColumn} column
   * @param {"chosen"} _kind
   */
  function pickEntry(column, _kind) {
    const chosen = multiple ? values[0] : value;
    if (!chosen) return undefined;
    return column.entries.find(
      (entry) =>
        !entry.disabled &&
        samePath(entry.ids, chosen.slice(0, entry.ids.length)),
    );
  }

  /**
   * @param {string} key
   * @param {"keyboard" | "pointer"} origin
   */
  function setCursor(key, origin) {
    cursorKey = key;
    cursorOrigin = origin;
    const entry = entryByKey.get(key);
    if (entry) viewCol = entry.col;
  }

  function back() {
    if (viewCol === 0) return;
    const parentKey = columns[shownCol].key;
    viewCol = shownCol - 1;
    if (entryByKey.has(parentKey)) cursorKey = parentKey;
  }

  // Choosing --------------------------------------------------------------

  /**
   * @param {import("./cascader-model.js").CascaderEntry} entry
   * @param {boolean} leaves - A leaf closes the menu.
   */
  function chooseSingle(entry, leaves) {
    if (readonly || entry.disabled) return;
    const path = resolvePath(nodes, loaded, entry.ids).nodes;
    commitSingle(entry.ids, path, leaves);
  }

  /**
   * @param {Array<CascaderNode["id"]>} ids
   * @param {CascaderNode[]} path
   * @param {boolean} closeAfter
   */
  function commitSingle(ids, path, closeAfter) {
    if (!samePath(ids, value)) {
      value = ids;
      dispatch("change", {
        value: ids,
        nodes: path,
        text: formatPath(path, pathToString, sep),
      });
      announcer.announce(selectedText(path));
    }
    if (closeAfter) close("select");
  }

  /** @param {string} key */
  function toggleCheck(key) {
    if (readonly) return;
    const entry = entryByKey.get(key);
    if (entry?.disabled) return;
    selection.toggle(key);
    emitChecked();
  }

  function emitChecked() {
    const reported = checkedPaths(
      nodes,
      loaded,
      selection.get().selected,
      showChecked,
    );
    if (samePaths(reported, lastValues)) return;
    lastValues = reported;
    values = reported;
    dispatch("change", {
      values: reported,
      paths: reported.map((ids) => resolvePath(nodes, loaded, ids).nodes),
    });
  }

  /**
   * Whether a click landed on the checkbox, the first 24px of the row at its
   * inline start. The box is drawn by a pseudo-element, so it is not a target.
   * @param {MouseEvent} event
   */
  function hitsCheckbox(event) {
    const label =
      event.target instanceof Element
        ? event.target.closest(".bx--checkbox-label")
        : null;
    if (!label) return false;
    const rect = label.getBoundingClientRect();
    const rtl = getComputedStyle(label).direction === "rtl";
    const offset = rtl ? rect.right - event.clientX : event.clientX - rect.left;
    return offset <= 24;
  }

  /**
   * Press on an entry with the pointer. In multiple mode a branch opens
   * unless the checkbox itself is pressed, so a column can be browsed without
   * checking what is in it.
   * @param {import("./cascader-model.js").CascaderEntry} entry
   * @param {MouseEvent} event
   */
  function clickEntry(entry, event) {
    if (disabled || readonly || entry.disabled) return;
    setCursor(entry.key, "pointer");
    if (multiple) {
      if (entry.branch && !hitsCheckbox(event)) expand(entry, false);
      else toggleCheck(entry.key);
      return;
    }
    if (entry.branch) {
      if (changeOnSelect) chooseSingle(entry, false);
      expand(entry, false);
    } else {
      chooseSingle(entry, true);
    }
  }

  /**
   * Enter or Space on the cursor.
   * @param {import("./cascader-model.js").CascaderEntry} entry
   */
  function activateEntry(entry) {
    if (readonly || entry.disabled) return;
    if (multiple) {
      toggleCheck(entry.key);
    } else if (entry.branch && !changeOnSelect) {
      expand(entry, true);
    } else {
      chooseSingle(entry, true);
    }
  }

  /**
   * Choose a search result.
   * @param {import("./cascader-model.js").CascaderSearchResult} result
   */
  async function chooseResult(result) {
    if (readonly) return;
    known = new Map(known).set(result.key, result.nodes);
    if (multiple) {
      await ensurePath(result.ids);
      if (destroyed) return;
      selection.toggle(result.key);
      emitChecked();
      return;
    }
    commitSingle(result.ids, result.nodes, true);
  }

  /**
   * Clear the choice.
   * @type {(options?: { focus?: boolean; open?: boolean; }) => Promise<void>}
   * @example
   * ```svelte
   * <Cascader bind:this={cascader} {nodes} />
   * <button on:click={() => cascader.clear()}>Clear</button>
   * ```
   */
  export async function clear(options = {}) {
    if (readonly || !hasSelection) return;
    if (multiple) {
      selection.clear();
      emitChecked();
    } else {
      value = [];
      dispatch("change", { value: [], nodes: [], text: "" });
      announcer.announce(selectionClearedText);
    }
    dirty = false;
    query = "";
    await tick();
    if (options.open) open = true;
    if (options.focus !== false) (filterable ? inputRef : ref)?.focus();
  }

  /** @param {CustomEvent<KeyboardEvent | MouseEvent> | KeyboardEvent} event */
  function clearFromEvent(event) {
    dispatch("clear", event instanceof CustomEvent ? event.detail : event);
    clear({ open: false });
  }

  // Keyboard --------------------------------------------------------------

  /**
   * @param {number} delta
   * @param {"step" | "first" | "last"} [mode]
   */
  function moveCursor(delta, mode = "step") {
    if (searching) {
      if (results.length === 0) return;
      searchIndex =
        mode === "first"
          ? 0
          : mode === "last"
            ? results.length - 1
            : Math.max(0, Math.min(results.length - 1, searchIndex + delta));
      cursorOrigin = "keyboard";
      return;
    }
    const column = cursor ? columns[cursor.col] : columns[shownCol];
    if (!column) return;
    const usable = column.entries.filter((entry) => !entry.disabled);
    if (usable.length === 0) return;
    let target;
    if (mode === "first") target = usable[0];
    else if (mode === "last") target = usable[usable.length - 1];
    else {
      const at = cursor ? usable.indexOf(cursor) : -1;
      const next =
        at === -1
          ? delta > 0
            ? 0
            : usable.length - 1
          : Math.max(0, Math.min(usable.length - 1, at + delta));
      target = usable[next];
    }
    if (target) setCursor(target.key, "keyboard");
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (disabled || isImeComposition(event)) return;
    const key = inlineKey(event.key, $layoutDirection, wrapperRef);
    // A search input keeps the text keys while the person is typing.
    const textKeys = filterable && dirty && !event.altKey;

    if (event.key === "Escape") {
      if (open) layer.escape(event);
      return;
    }
    if (event.key === "Tab") return;

    if (!open) {
      if (readonly) return;
      if (
        key === "ArrowDown" ||
        key === "ArrowUp" ||
        (!filterable && (event.key === "Enter" || event.key === " "))
      ) {
        event.preventDefault();
        openMenu("keydown");
        return;
      }
      if (
        !filterable &&
        canClear &&
        (event.key === "Backspace" || event.key === "Delete")
      ) {
        clearFromEvent(event);
      }
      return;
    }

    if (searching) {
      handleSearchKey(event, key, textKeys);
      return;
    }

    switch (key) {
      case "ArrowDown":
        event.preventDefault();
        moveCursor(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        moveCursor(-1);
        return;
      case "PageDown":
        event.preventDefault();
        moveCursor(MENU_PAGE_STEP);
        return;
      case "PageUp":
        event.preventDefault();
        moveCursor(-MENU_PAGE_STEP);
        return;
      case "Home":
        if (textKeys) return;
        event.preventDefault();
        moveCursor(0, "first");
        return;
      case "End":
        if (textKeys) return;
        event.preventDefault();
        moveCursor(0, "last");
        return;
      case "ArrowRight":
        if (textKeys) return;
        event.preventDefault();
        if (cursor?.branch) expand(cursor, true);
        return;
      case "ArrowLeft": {
        if (textKeys) return;
        event.preventDefault();
        if (cursor && cursor.col > 0) {
          const parent = entryByKey.get(pathKey(cursor.ids.slice(0, -1)));
          if (parent) setCursor(parent.key, "keyboard");
        }
        return;
      }
      case "Enter":
        event.preventDefault();
        if (cursor) activateEntry(cursor);
        return;
      case " ":
        if (textKeys || filterable) return;
        event.preventDefault();
        if (cursor) activateEntry(cursor);
        return;
      default:
    }

    if (!filterable && (event.key === "Backspace" || event.key === "Delete")) {
      if (canClear) {
        event.preventDefault();
        clearFromEvent(event);
      }
      return;
    }
    if (!filterable && isTypeaheadKey(event) && cursor) {
      const column = columns[cursor.col];
      const typed = typeahead.push(event.key);
      const at = typeaheadIndex({
        items: column.entries,
        query: typed,
        itemToString: (entry) => entry.node.text,
        index: cursor.index,
        isDisabled: (entry) => entry.disabled,
      });
      const target = column.entries[at];
      if (target) setCursor(target.key, "keyboard");
    }
  }

  /**
   * @param {KeyboardEvent} event
   * @param {string} key
   * @param {boolean} textKeys
   */
  function handleSearchKey(event, key, textKeys) {
    switch (key) {
      case "ArrowDown":
        event.preventDefault();
        moveCursor(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        moveCursor(-1);
        return;
      case "PageDown":
        event.preventDefault();
        moveCursor(MENU_PAGE_STEP);
        return;
      case "PageUp":
        event.preventDefault();
        moveCursor(-MENU_PAGE_STEP);
        return;
      case "Home":
        if (textKeys && !event.ctrlKey) return;
        event.preventDefault();
        moveCursor(0, "first");
        return;
      case "End":
        if (textKeys && !event.ctrlKey) return;
        event.preventDefault();
        moveCursor(0, "last");
        return;
      case "Enter": {
        event.preventDefault();
        const result = results[searchIndex];
        if (result) chooseResult(result);
        return;
      }
      default:
    }
  }

  function handleFieldClick() {
    if (disabled || readonly) return;
    if (open) close("select");
    else openMenu("click");
  }

  function handleInput() {
    if (disabled || readonly) return;
    dirty = true;
    query = inputText;
    if (!open) openMenu("input");
  }

  function clearSearch() {
    dirty = false;
    query = "";
    inputText = multiple ? "" : displayText;
    inputRef?.focus();
  }

  $: if (open || wasOpen) tick().then(syncOpenEvent);
</script>

<div
  bind:this={wrapperRef}
  class:bx--cascader__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--multi-select__wrapper={multiple}
>
  {#if name}
    {#each formEntries as path (pathKey(path))}
      <input
        type="hidden"
        {name}
        value={JSON.stringify(path)}
        {disabled}
        {form}
      />
    {/each}
    {#if formEntries.length === 0}
      <input type="hidden" {name} value="" {disabled} {form} />
    {/if}
  {/if}
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLabel}
    >
      <slot name="labelChildren">{labelText}</slot>
    </label>
  {/if}
  <ListBox
    class={listBoxClass}
    {disabled}
    invalid={showInvalid}
    invalidText={shownInvalidText}
    invalidId={errorId}
    {open}
    size={effectiveSize}
    warn={showWarn}
    {warnText}
    {warnId}
  >
    {#if !(filterable && single)}
      {#if showInvalid}
        <WarningFilled class="bx--list-box__invalid-icon" />
      {/if}
      {#if showWarn}
        <WarningAltFilled
          class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
        />
      {/if}
    {/if}
    {#if filterable}
      <div style="display: contents">
        <div
          bind:this={fieldRef}
          class:bx--list-box__field={true}
          class:bx--list-box__field--wrapper--input-focused={showFieldFocus}
        >
          {#if multiple && selectionCount > 0}
            <ListBoxSelection
              {selectionCount}
              on:clear={clearFromEvent}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
            />
          {/if}
          <input
            bind:this={inputRef}
            bind:value={inputText}
            aria-invalid={showInvalid ? "true" : undefined}
            aria-required={required ? "true" : undefined}
            {...$$restProps}
            role="combobox"
            tabindex="0"
            autocomplete="off"
            aria-autocomplete="list"
            aria-haspopup={searching ? "listbox" : "tree"}
            aria-expanded={open ? "true" : "false"}
            aria-activedescendant={highlightedId}
            aria-disabled={disabled ? "true" : undefined}
            aria-readonly={readonly ? "true" : undefined}
            aria-controls={open ? menuId : undefined}
            aria-describedby={fieldDescribedById}
            class:bx--text-input={true}
            class:bx--text-input--empty={inputText === ""}
            on:click={() => {
              if (disabled || readonly) return;
              if (!open) openMenu("click");
            }}
            on:keydown
            on:keydown={(event) => {
              if (event.key !== "Escape") event.stopPropagation();
              handleKeydown(event);
            }}
            on:input
            on:input={handleInput}
            on:keyup
            on:focus
            on:focus={() => {
              fieldFocused = true;
            }}
            on:blur
            on:blur={() => {
              fieldFocused = false;
            }}
            on:paste
            {disabled}
            {readonly}
            placeholder={placeholder || label}
            {id}
          />
          {#if single && showInvalid}
            <WarningFilled class="bx--list-box__invalid-icon" />
          {/if}
          {#if single && showWarn}
            <WarningAltFilled
              class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
            />
          {/if}
          {#if inputText && !readonly}
            <ListBoxSelection
              on:clear={() => (single && !dirty ? clear() : clearSearch())}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
            />
          {/if}
          <ListBoxMenuIcon
            on:click={(event) => {
              if (disabled) return;
              event.stopPropagation();
              handleFieldClick();
            }}
            {translateWithId}
            {open}
          />
        </div>
      </div>
    {:else}
      <div
        style={multiple ? undefined : "display: contents"}
        class:bx--list-box__field--wrapper={multiple}
        class:bx--list-box__field--wrapper--input-focused={multiple &&
          showFieldFocus}
      >
        <ListBoxField
          aria-invalid={showInvalid || undefined}
          aria-required={required || undefined}
          {...$$restProps}
          role="combobox"
          tabindex="0"
          aria-haspopup="tree"
          aria-expanded={open ? "true" : "false"}
          aria-activedescendant={highlightedId}
          aria-controls={open ? menuId : undefined}
          aria-describedby={fieldDescribedById}
          bind:ref
          on:focus={() => {
            fieldFocused = true;
          }}
          on:click={handleFieldClick}
          on:keydown={(event) => {
            if (disabled) return;
            if (
              event.key === " " ||
              event.key === "Enter" ||
              event.key === "ArrowUp" ||
              event.key === "ArrowDown"
            ) {
              event.preventDefault();
            }
            handleKeydown(event);
          }}
          on:blur={() => {
            fieldFocused = false;
          }}
          {id}
          {disabled}
          {readonly}
        >
          {#if multiple && selectionCount > 0}
            <ListBoxSelection
              {selectionCount}
              on:clear={clearFromEvent}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
            />
          {/if}
          <span
            class:bx--list-box__label={true}
            title={displayText || undefined}>{displayText || label || ""}</span
          >
          {#if single && canClear}
            <ListBoxSelection
              on:clear={clearFromEvent}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
            />
          {/if}
          <ListBoxMenuIcon {open} {translateWithId} />
        </ListBoxField>
      </div>
    {/if}
    {#if required}
      <ListBoxRequiredInput
        hasValue={hasSelection}
        {disabled}
        {readonly}
        focusTarget={filterable ? inputRef : ref}
        {form}
        on:invalid={() => (requiredError = true)}
        on:reset={() => (requiredError = false)}
      />
    {/if}
    {#if open}
      <CascaderMenu
        bind:ref={menuRef}
        portal={effectivePortalMenu}
        {open}
        anchor={filterable ? fieldRef : ref}
        direction={placement}
        {drill}
        size={effectiveSize}
        {multiple}
      >
        {#if searching}
          <div
            role="listbox"
            id={menuId}
            aria-label={menuAriaLabel}
            aria-multiselectable={multiple ? "true" : undefined}
            aria-busy={searchBusy ? "true" : undefined}
            class:bx--cascader__results={true}
          >
            {#each results as result, index (result.key)}
              {@const checked = checkedKeys.has(result.key)}
              <CascaderOption
                role="option"
                optionId={optionDomId(result.key)}
                text={result.text}
                ranges={result.ranges}
                checkbox={multiple}
                {checked}
                selected={single && result.key === valueKey}
                highlighted={index === searchIndex}
                {readonly}
                disabled={result.nodes.some((node) => node.disabled)}
                on:click={() => chooseResult(result)}
                on:mouseenter={() => {
                  searchIndex = index;
                  cursorOrigin = "pointer";
                }}
              />
            {/each}
          </div>
          {#if searchBusy && results.length === 0}
            <ListBoxMenuStatus>
              <InlineLoading description={loadingText} />
            </ListBoxMenuStatus>
          {:else if searchFailed}
            <ListBoxMenuStatus>{emptyText}</ListBoxMenuStatus>
          {:else if results.length === 0 && $searchSource.status === "success"}
            <ListBoxMenuStatus>
              <slot name="empty" {query}>{emptyText}</slot>
            </ListBoxMenuStatus>
          {/if}
          {#if truncated}
            <ListBoxMenuStatus
              >{moreResultsText(results.length)}</ListBoxMenuStatus
            >
          {/if}
        {:else}
          {#if drill}
            {#if shownCol > 0}
              <div class:bx--cascader__back={true}>
                <button
                  type="button"
                  tabindex="-1"
                  class:bx--cascader__back-button={true}
                  aria-label={backText(backTitle)}
                  on:click={back}
                >
                  <ChevronLeft aria-hidden="true" />
                  <span class:bx--cascader__back-text={true}>{backTitle}</span>
                </button>
                <span class:bx--cascader__back-title={true} aria-hidden="true"
                  >{columns[shownCol].parent?.text}</span
                >
              </div>
            {/if}
          {/if}
          <div
            role="tree"
            id={menuId}
            aria-label={menuAriaLabel}
            aria-multiselectable={multiple ? "true" : undefined}
            aria-busy={busy ? "true" : undefined}
            class:bx--cascader__columns={true}
          >
            {#each columns as column, col (col)}
              <div
                class:bx--cascader__column={true}
                hidden={drill && col !== shownCol ? true : undefined}
              >
                {#if column.entries.length > 0}
                  <div
                    role="group"
                    aria-label={levelLabels[col] ||
                      column.parent?.text ||
                      labelText}
                  >
                    {#each column.entries as entry (entry.key)}
                      {@const state = loadStates.get(entry.key)}
                      <CascaderOption
                        optionId={optionDomId(entry.key)}
                        text={entry.node.text}
                        level={col + 1}
                        posInSet={entry.index + 1}
                        setSize={entry.size}
                        branch={entry.branch}
                        expanded={trailKeys.has(entry.key)}
                        selected={single && entry.key === valueKey}
                        checkbox={multiple}
                        checked={checkedKeys.has(entry.key)}
                        indeterminate={partialKeys.has(entry.key)}
                        highlighted={entry.key === cursorKey}
                        disabled={entry.disabled}
                        {readonly}
                        loadState={state}
                        errorText={state === "error"
                          ? loadErrorText(entry.node)
                          : ""}
                        on:click={(event) => clickEntry(entry, event)}
                        on:expand={() => expand(entry, false)}
                        on:mouseenter={() => {
                          cursorOrigin = "pointer";
                          if (!entry.disabled) cursorKey = entry.key;
                        }}
                      />
                    {/each}
                  </div>
                {/if}
                {#if column.status === "loading"}
                  <ListBoxMenuStatus>
                    <InlineLoading description={loadingText} />
                  </ListBoxMenuStatus>
                {:else if column.status === "error"}
                  <ListBoxMenuStatus>
                    <span
                      >{column.parent ? loadErrorText(column.parent) : ""}</span
                    >
                    <!-- Pointer-only, like the chevron: focus stays on the field,
                         and Right on the parent loads it again. -->
                    <button
                      type="button"
                      tabindex="-1"
                      aria-hidden="true"
                      class:bx--cascader__retry={true}
                      on:click={() => retry(column.key)}>{retryText}</button
                    >
                  </ListBoxMenuStatus>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CascaderMenu>
    {/if}
  </ListBox>
  {#if !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if readonly}
    <span id={readonlyId} class:bx--visually-hidden={true}>{readonlyText}</span>
  {/if}
  {#if canClear}
    <span id={selectionId} class:bx--visually-hidden={true}
      >{clearSelectionText}</span
    >
  {/if}
</div>
