<script>
  /**
   * @template {TreeSelectNode<any>} [Node=TreeSelectNode<any>]
   */

  /**
   * @template [Id=(string|number)]
   * @typedef {object} TreeSelectNode
   * @property {Id} id
   * @property {string} text
   * @property {boolean} [disabled] - Whether the node is disabled
   * @property {boolean} [hasChildren] - Whether the node has children that have not been loaded yet. Renders an expander without a `nodes` array; expanding it calls `loadChildren`.
   * @property {TreeSelectNode<Id>[]} [nodes]
   */

  /**
   * @template [Id=(string|number)]
   * @typedef {object} TreeSelectCheckChange
   * @property {ReadonlyArray<Id>} checkedIds - The full set of checked node ids after the change
   * @property {Array<Id>} added - Node ids checked since the previous change
   * @property {Array<Id>} removed - Node ids unchecked since the previous change
   * @property {ReadonlyArray<Id>} indeterminateIds - The partially checked node ids after the change
   */

  /**
   * @event select
   * @type {object}
   * @property {Node["id"]} selectedId
   * @property {Node} selectedNode
   */

  /**
   * @event check:change
   * @type {TreeSelectCheckChange<Node["id"]>}
   */

  /**
   * @event {{ node: Node; expanded: boolean; }} toggle
   * @event {{ node: Node; nodes: ReadonlyArray<Node>; }} load
   * @event {{ node: Node; error: unknown; }} load:error
   * @event {KeyboardEvent | MouseEvent} clear
   * @event {{ trigger: "click" | "keydown" | "input" | "programmatic" }} open
   * @event {{ trigger: "escape-key" | "outside-click" | "select" }} close
   * @slot {{ value: string; }} empty
   * @restProps {button | input}
   */

  /**
   * Set the nodes to render. A node's `nodes` are its children.
   * @type {ReadonlyArray<Node>}
   */
  export let nodes = [];

  /**
   * Specify how nodes are chosen. `"single"` picks one node. `"checkbox"`
   * renders a tri-state checkbox on every node and picks many, as
   * `TreeView`'s `selectionMode="checkbox"` does.
   * @type {"single" | "checkbox"}
   */
  export let selectionMode = "single";

  /**
   * Specify the selected node id in `selectionMode="single"`.
   * @type {Node["id"] | undefined}
   * @bindable writable
   */
  export let selectedId = undefined;

  /**
   * Specify which nodes can be selected in `selectionMode="single"`.
   * `"leaf"` makes a parent only expand and collapse.
   * @type {"any" | "leaf"}
   */
  export let selectable = "any";

  /**
   * The node ids that are checked in `selectionMode="checkbox"`. Resolved
   * the way `TreeView` resolves them: with `checkMode="deep"` a checked
   * parent lists every non-disabled descendant, and a parent whose children
   * are all checked is checked itself. While a lazy parent has not loaded,
   * an id that matches no node stays checked, so a saved check on a node
   * that has not loaded yet is kept.
   * @type {ReadonlyArray<Node["id"]>}
   * @bindable writable
   */
  export let checkedIds = [];

  /**
   * The node ids that are partially checked in `selectionMode="checkbox"`.
   * Derived from `checkedIds`; writes to this prop are overwritten.
   * @type {ReadonlyArray<Node["id"]>}
   * @bindable readonly
   */
  export let indeterminateIds = [];

  /**
   * In `selectionMode="checkbox"`, how far a check propagates:
   * - `'node'`: only the clicked node
   * - `'deep'`: the node plus all non-disabled descendants, with ancestors
   *   deriving an indeterminate state (default)
   * @type {"node" | "deep"}
   */
  export let checkMode = "deep";

  /**
   * Which checked nodes the field reports as text or tags, and submits with
   * `name`. With `"parent"` a fully checked branch reads as one entry: its
   * topmost node. `"leaf"` lists only nodes without children, `"all"` lists
   * every checked node. `checkMode="node"` always lists every checked node.
   * @type {"parent" | "leaf" | "all"}
   */
  export let showChecked = "parent";

  /**
   * Specify how the checked nodes show in the field. `"text"` lists their
   * labels in the field. `"tags"` also lists each one as a dismissible tag
   * below the field.
   * @type {"text" | "tags"}
   */
  export let selectionDisplay = "text";

  /**
   * With `selectionDisplay="tags"`, `"wrap"` shows every tag on as many rows
   * as needed, and `"collapse"` keeps one row and collapses the rest into a
   * "+N" button.
   * @type {"wrap" | "collapse"}
   */
  export let tagOverflow = "wrap";

  /**
   * With `selectionDisplay="tags"`, the most tags to mount. Further entries
   * stay selected and listed in the field, and one non-dismissible tag counts
   * them. Each tag registers with `TagSet`, so thousands cost seconds.
   */
  export let tagLimit = 100;

  /**
   * Specify the text of the tag that counts the entries past `tagLimit`.
   * @type {(count: number) => string}
   */
  export let tagLimitText = function tagLimitText(count) {
    return `+${count} more`;
  };

  /**
   * With `selectionDisplay="tags"`, the accessible name prefix of each
   * tag's remove button.
   */
  export let removeTagText = "Remove";

  /**
   * Specify the node ids that are expanded in the menu.
   * Opening the menu expands the ancestors of the selected node.
   * @type {ReadonlyArray<Node["id"]>}
   * @bindable writable
   */
  export let expandedIds = [];

  /**
   * Override the label of a node.
   * @type {(node: Node) => string}
   */
  export let nodeToString = function nodeToString(node) {
    return String(node.text ?? node.id);
  };

  /**
   * Load a lazy parent's children when it first expands. A node is lazy
   * when it has `hasChildren: true` and no `nodes`. While the promise is
   * pending the expander shows a spinner; if it rejects the node collapses
   * and expanding it again retries. The nodes you return are overlaid on
   * `nodes`, which is never mutated.
   * @type {((node: Node) => Promise<ReadonlyArray<Node>>) | undefined}
   */
  export let loadChildren = undefined;

  /**
   * Set to `true` to search the tree in the field. The menu keeps only the
   * nodes that match and their ancestors, all expanded.
   */
  export let filterable = false;

  /**
   * The text in the search field.
   * In `selectionMode="single"` it holds the selected node's label while
   * the menu is closed.
   * @bindable writable
   */
  export let value = "";

  /**
   * Decide whether a node matches the search text. Ancestors of a match
   * stay in the menu whatever this returns for them.
   * @type {(node: Node, value: string) => boolean}
   */
  export let shouldFilterNode = function shouldFilterNode(node, value) {
    return String(node.text ?? node.id)
      .toLowerCase()
      .includes(value.trim().toLowerCase());
  };

  /** Specify the placeholder of the search field. */
  export let placeholder = "";

  /**
   * Specify the size of the field.
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default, which overrides a
   * `Form` size). `"lg"` and `"xl"` are both 48px.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the direction of the menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /**
   * Set to `true` to show a clear button when something is selected, and to
   * clear it with Delete or Backspace. In `selectionMode="checkbox"` the
   * clear button is always there.
   */
  export let clearable = false;

  /**
   * Specify the assistive text advertising the keyboard shortcut that clears
   * the selection. Only used when something can be cleared.
   */
  export let clearSelectionText =
    "To clear the selection, press Delete or Backspace";

  /**
   * Specify the text announced when the selection is cleared.
   */
  export let selectionClearedText = "Selection cleared";

  /**
   * Set to `true` to reopen the menu after clearing the selection.
   */
  export let openOnClear = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context.
   */
  export let fluid = false;

  /**
   * Set to `true` to render condensed menu items in the fluid variant.
   */
  export let condensed = false;

  /**
   * Specify the text shown in the field when nothing is selected.
   * @type {string | undefined}
   */
  export let label = undefined;

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Override the chevron icon label based on the open state.
   * @type {((id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string) | undefined}
   */
  export let translateWithId = undefined;

  /**
   * Override the label of the clear button.
   * @type {((id: "clearAll" | "clearSelection") => string) | undefined}
   */
  export let translateWithIdSelection = undefined;

  /**
   * Enable windowing for large trees. By default a tree of more than 100
   * nodes renders only the rows in view. Set `virtualize={false}` to render
   * every visible row, `virtualize={true}` to always window, or pass an
   * object (`itemHeight`, `containerHeight`, `overscan`, `threshold`) to
   * tune it.
   * @type {undefined | boolean | { itemHeight?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number, optimizeFastScroll?: boolean }}
   */
  export let virtualize = undefined;

  /**
   * Specify the message shown in the open menu when no node matches.
   * Screen readers hear it through the status live region.
   * Set to `""` to show no message.
   */
  export let emptyText = "No results";

  /**
   * Specify the text announced for the number of nodes a search finds.
   * @type {(count: number) => string}
   */
  export let filterResultsText = function filterResultsText(count) {
    if (count === 0) return "No results";
    return count === 1 ? "1 result" : `${count} results`;
  };

  /**
   * Specify the text announced for the number of checked nodes.
   * @type {(count: number) => string}
   */
  export let selectionCountText = function selectionCountText(count) {
    return count === 1 ? "1 item selected" : `${count} items selected`;
  };

  /**
   * Specify the text announced while a lazy node loads.
   * @type {(node: Node) => string}
   */
  export let loadingNodeText = function loadingNodeText(node) {
    return `Loading ${node.text}`;
  };

  /**
   * Specify the text announced when a lazy node fails to load. It also
   * describes the node's row and shows as a tooltip on its error icon.
   * @type {(node: Node) => string}
   */
  export let loadErrorText = function loadErrorText(node) {
    return `Could not load ${node.text}. Expand it to try again.`;
  };

  /**
   * Set to `true` to show a loading row after the nodes, such as while the
   * first level loads. Marks the menu `aria-busy`.
   */
  export let loading = false;

  /** Specify the text of the loading row */
  export let loadingText = "Loading...";

  /**
   * Set to `true` to always render the menu in a portal, or `false` to
   * keep it in place. Left unset, the menu moves to a portal inside a
   * Modal, or when a box around it would cut it off.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /** Set an id for the field */
  export let id = uniqueId();

  /**
   * Specify a name attribute for native form submission. Mounts one hidden
   * input per entry: the selected id, or the checked ids `showChecked`
   * reports. Omitted when the field is disabled.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate the
   * hidden `name` inputs with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Set to `true` to require a selection. A wrapping `<form>` blocks
   * submission while nothing is selected, and the field shows its invalid
   * state with `requiredInvalidText`.
   */
  export let required = false;

  /** Specify the invalid state text shown when a required field blocks submission. */
  export let requiredInvalidText = "Select an item";

  /**
   * Obtain a reference to the field button.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Obtain a reference to the search input.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let inputRef = null;

  /**
   * Obtain a reference to the menu element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let listRef = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import ListBoxMenuStatus from "../ListBox/ListBoxMenuStatus.svelte";
  import ListBoxRequiredInput from "../ListBox/ListBoxRequiredInput.svelte";
  import {
    ListBox,
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxSelection,
  } from "../ListBox/index.js";
  import {
    MENU_PAGE_STEP,
    shouldVirtualizeMenu,
  } from "../ListBox/list-box-utils.js";
  import {
    createMenuCloseHandler,
    createMenuOpenHandler,
    createStatusAnnouncer,
  } from "../ListBox/menu-status.js";
  import {
    createMenuWindow,
    scheduleHighlightScroll,
  } from "../ListBox/menu-window.js";
  import Tag from "../Tag/Tag.svelte";
  import TagSet from "../TagSet/TagSet.svelte";
  import VirtualWindow from "../VirtualList/VirtualWindow.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { clampIndex } from "../utils/clamp-index.js";
  import { dismiss } from "../utils/dismiss.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { filterTreeNodes } from "../utils/filter-tree-nodes.js";
  import { clippedBy } from "../utils/fit-align.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import { menuSide } from "../utils/menu-placement.js";
  import {
    resolveCheckboxState,
    toggleCheckboxNode,
  } from "../utils/tree-checkbox-state.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { resetVirtualScrollOnClose } from "../utils/virtualize.js";
  import TreeSelectRow from "./TreeSelectRow.svelte";
  import {
    diffIds,
    expandableIds,
    flattenVisible,
    indexTree,
    sameIds,
    shownCheckedIds,
    unresolvedIds,
    withLoadedChildren,
  } from "./tree-select-rows.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext(MODAL_CONTEXT_KEY);
  const formContext = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();
  $: effectiveSize = size ?? $formSize;

  // Set for one open when the in-place menu turns out to be cut off by a
  // box around it: the menu moves to a portal instead.
  let portalWhenClipped = false;
  $: if (!open) portalWhenClipped = false;

  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal || portalWhenClipped : portalMenu;

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
    if (!(open && listRef && anchor)) return;
    const mayPortal = portalMenu === undefined;
    if (mayPortal && clippedBy(listRef)) {
      portalWhenClipped = true;
      return;
    }
    const side = menuSide(anchor, listRef, direction);
    if (side === placement) return;
    measuredSide = side;
    await tick();
    if (mayPortal && open && listRef && clippedBy(listRef)) {
      portalWhenClipped = true;
    }
  }

  /** @type {null | HTMLDivElement} */
  let fieldRef = null;
  /** @type {null | HTMLDivElement} */
  let wrapperRef = null;
  /** @type {null | HTMLDivElement} */
  let tagsRef = null;
  let fieldFocused = false;
  let requiredError = false;
  let highlightedIndex = -1;
  let highlightOrigin = /** @type {"keyboard" | "pointer" | null} */ (null);
  let prevHighlightedRow = -1;
  let listScrollTop = 0;
  let statusText = "";
  let destroyed = false;
  /** Children `loadChildren` returned, by parent id. */
  let loadedChildren = /** @type {Map<Node["id"], ReadonlyArray<Node>>} */ (
    new Map()
  );
  /** The lazy parents that are loading, or failed to. */
  let loadStates = /** @type {Map<Node["id"], "loading" | "error">} */ (
    new Map()
  );
  /** A node to highlight once the rows that hold it exist. */
  let pendingHighlightId = /** @type {Node["id"] | undefined} */ (undefined);
  /** @type {import("../ListBox/menu-window.js").MenuWindowState} */
  let menuState;

  const typeahead = createTypeaheadBuffer();
  const menuWindow = createMenuWindow({
    getContainer: () => listRef,
    onScrollTop: (scrollTop) => {
      listScrollTop = scrollTop;
    },
    onState: (state) => {
      menuState = state;
    },
  });

  const { openMenu, sync: syncOpenEvent } = createMenuOpenHandler({
    getOpen: () => open,
    setOpen: (v) => (open = v),
    dispatch,
  });
  /** @type {(trigger: "escape-key" | "outside-click" | "select") => void} */
  const close = createMenuCloseHandler({
    getOpen: () => open,
    setOpen: (v) => (open = v),
    dispatch,
  });

  onMount(() => () => {
    destroyed = true;
    typeahead.clear();
    menuWindow.destroy();
  });

  $: checkbox = selectionMode === "checkbox";
  $: single = !checkbox;
  $: cascade = checkMode !== "node";
  $: menuId = `menu-${id}`;
  $: ({ helperId, errorId, warnId, readonlyId } = buildFieldIds(id));
  $: selectionId = `selection-${id}`;
  $: isFluid = fluid || !!formContext?.isFluid;
  $: showFieldFocus = !isFluid && (fieldFocused || open);
  $: showFluidFieldFocus = isFluid && (fieldFocused || open);
  $: fluidNeutral =
    isFluid && !showInvalid && !showWarn && !disabled && !readonly;
  $: fluidHoverable = isFluid && !disabled && !readonly;
  $: hasFluidMenuItems = isFluid && !condensed && !effectivePortalMenu;

  // Derived below. Typed loosely: a node is the consumer's own shape.
  /** @type {ReadonlyArray<any>} */
  let viewNodes;
  /** @type {ReturnType<typeof indexTree<any>>} */
  let treeIndex;
  /** @type {any} */
  let selectedNode;
  /** @type {Array<any>} */
  let shownEntries;
  /** @type {Array<import("./tree-select-rows.js").TreeSelectRow<any>>} */
  let rows;
  /** @type {Array<import("./tree-select-rows.js").TreeSelectRow<any>>} */
  let itemsToRender;
  /** @type {undefined | import("./tree-select-rows.js").TreeSelectRow<any>} */
  let highlightedRow;
  /** @type {"xs" | "sm" | "default"} */
  let tagSize;

  // The consumer's tree with any lazily loaded children laid over it.
  $: viewNodes = withLoadedChildren(nodes, loadedChildren);
  $: treeIndex = indexTree(viewNodes);

  // Checkbox state: the same resolution `TreeView` runs, gated on its inputs
  // so an unrelated update does not walk the tree again.
  /** @type {ReadonlyArray<Node> | null} */
  let prevResolveNodes = null;
  /** @type {ReadonlyArray<Node["id"]> | null} */
  let prevResolveChecked = null;
  let prevResolveCascade = cascade;
  $: if (checkbox) {
    if (
      viewNodes !== prevResolveNodes ||
      checkedIds !== prevResolveChecked ||
      cascade !== prevResolveCascade
    ) {
      const state = resolveChecked(checkedIds, viewNodes, treeIndex);
      if (!sameIds(state.checkedIds, checkedIds)) checkedIds = state.checkedIds;
      if (!sameIds(state.indeterminateIds, indeterminateIds)) {
        indeterminateIds = state.indeterminateIds;
      }
      prevResolveNodes = viewNodes;
      prevResolveChecked = checkedIds;
      prevResolveCascade = cascade;
    }
  } else if (indeterminateIds.length > 0) {
    indeterminateIds = [];
  }
  $: checkedSet = new Set(checkedIds);
  $: indeterminateSet = new Set(indeterminateIds);
  $: expandedSet = new Set(expandedIds);

  $: selectedNode =
    single && selectedId !== undefined
      ? (treeIndex.byId.get(selectedId) ?? undefined)
      : undefined;
  $: selectedText = selectedNode ? nodeToString(selectedNode) : "";

  // Ids that name nodes a lazy parent has not loaded yet. They stay
  // selected and submit with the form until their nodes load.
  $: pendingIds = checkbox
    ? unresolvedIds(checkedIds, treeIndex)
    : selectedId !== undefined && !selectedNode
      ? unresolvedIds([selectedId], treeIndex)
      : [];

  // Entries the field reports: tags, text and form values.
  $: shownIds = checkbox
    ? shownCheckedIds(checkedIds, cascade ? showChecked : "all", treeIndex)
    : selectedNode
      ? [selectedNode.id]
      : [];
  $: shownEntries = shownIds
    .map((entryId) => treeIndex.byId.get(entryId))
    .filter((node) => node !== undefined);
  $: formEntries = shownEntries.filter((node) => !node.disabled);
  $: hasFormValue = formEntries.length > 0 || pendingIds.length > 0;
  $: selectionCount = checkbox ? shownEntries.length : 0;
  $: hasSelection = shownEntries.length > 0;

  // The search text is a query once the user edits it. Single mode shows the
  // selected label in the same input, which is not one.
  $: searching =
    open &&
    filterable &&
    value.trim() !== "" &&
    !(single && value === selectedText);
  $: matchNodes = searching
    ? filterTreeNodes(
        /** @type {any} */ (viewNodes),
        (node) => shouldFilterNode(/** @type {Node} */ (node), value),
        { includeAncestors: true, includeChildren: false },
      )
    : viewNodes;
  // A search holds every ancestor of a match open.
  $: effectiveExpanded = searching
    ? expandableIds(/** @type {any} */ (matchNodes))
    : expandedSet;
  $: rows = open
    ? flattenVisible(/** @type {any} */ (matchNodes), effectiveExpanded)
    : [];
  $: hasNoRows = open && !loading && rows.length === 0;
  $: showEmpty = hasNoRows && ($$slots.empty || emptyText !== "");

  // The rows showing are what gets windowed, not the whole tree: a tree of
  // 5,000 nodes with a few branches open is a short list.
  $: shouldVirtualize = shouldVirtualizeMenu({ items: rows, virtualize });
  $: menuState = menuWindow.update({
    items: /** @type {any[]} */ (rows),
    shouldVirtualize,
    virtualize,
    size: effectiveSize,
    fluid: hasFluidMenuItems,
    scrollTop: listScrollTop,
  });
  $: itemsToRender = rowsToRender(menuState);
  $: ({
    isVirtualized,
    startIndex,
    offsetY,
    totalHeight,
    menuMaxHeight,
    isWindowed,
    isPinned,
  } = menuState);

  // Opening and closing reset the highlight. The assignments are inline, not
  // in a helper, so the statements below that read what they write run after.
  let prevOpen = false;
  $: if (open !== prevOpen) {
    prevOpen = open;
    highlightedIndex = -1;
    highlightOrigin = null;
    pendingHighlightId = undefined;
    if (open) {
      if (single && selectedNode) {
        // Show the selection: open every branch above it, and highlight it
        // once the rows that hold it exist.
        expandedIds = [
          ...new Set([
            ...expandedIds,
            ...ancestorIds(selectedNode.id, treeIndex),
          ]),
        ];
        pendingHighlightId = selectedNode.id;
      }
    } else {
      // Closing puts the selection back in the search input after a search
      // that picked nothing. Only on the transition: typing into a closed
      // input is what opens it.
      if (filterable) value = single ? selectedText : "";
      prevHighlightedRow = -1;
      listScrollTop = resetVirtualScrollOnClose();
      typeahead.clear();
      menuWindow.reset();
    }
  }
  $: if (open || prevOpen) tick().then(syncOpenEvent);

  $: ({
    index: highlightedIndex,
    origin: highlightOrigin,
    pending: pendingHighlightId,
  } = reconcileHighlight(
    rows,
    pendingHighlightId,
    highlightedIndex,
    highlightOrigin,
  ));
  $: highlightedRow =
    highlightedIndex > -1 ? rows[highlightedIndex] : undefined;
  $: highlightedId = highlightedRow
    ? rowDomId(highlightedRow.node.id, id, treeIndex)
    : undefined;
  $: prevHighlightedRow = scheduleHighlightScroll({
    open,
    shouldVirtualize,
    highlightedIndex,
    prevHighlightedIndex: prevHighlightedRow,
    listRef,
    highlightOrigin,
    menuWindow,
  });

  /**
   * The rows of the window `menuWindow` resolved. It types them loosely, since
   * it serves menus of any option shape.
   * @param {{ itemsToRender: unknown[] }} state
   * @returns {typeof rows}
   */
  function rowsToRender(state) {
    return /** @type {typeof rows} */ (state.itemsToRender);
  }

  /** @type {typeof rows} */
  let prevRows = [];

  /**
   * Keep the highlight on the same node when the rows change under it, as a
   * search does, and land it on a node a pending open asked for. An index
   * cached against the old rows would otherwise point at some other node.
   * @param {typeof rows} nextRows
   * @param {Node["id"] | undefined} pendingId
   * @param {number} index
   * @param {"keyboard" | "pointer" | null} origin
   */
  function reconcileHighlight(nextRows, pendingId, index, origin) {
    let nextIndex = index;
    let nextOrigin = origin;
    let nextPending = pendingId;
    if (pendingId !== undefined) {
      if (nextRows.length > 0) {
        nextIndex = nextRows.findIndex((row) => row.node.id === pendingId);
        nextOrigin = nextIndex > -1 ? "keyboard" : null;
        nextPending = undefined;
      }
    } else if (nextRows !== prevRows && index > -1) {
      const keep = prevRows[index]?.node.id;
      nextIndex = nextRows.findIndex((row) => row.node.id === keep);
      if (nextIndex === -1) nextOrigin = null;
    }
    if (nextIndex >= nextRows.length) {
      nextIndex = -1;
      nextOrigin = null;
    }
    prevRows = nextRows;
    return { index: nextIndex, origin: nextOrigin, pending: nextPending };
  }

  /**
   * Ids from a root down to the parent of `nodeId`.
   * @param {Node["id"]} nodeId
   * @param {ReturnType<typeof indexTree>} index
   * @returns {Array<Node["id"]>}
   */
  function ancestorIds(nodeId, index) {
    /** @type {Array<Node["id"]>} */
    const ancestors = [];
    let parentId = index.parentById.get(nodeId);
    while (parentId != null) {
      ancestors.unshift(parentId);
      parentId = index.parentById.get(parentId);
    }
    return ancestors;
  }

  /**
   * @param {Node["id"]} nodeId
   * @param {string} instanceId
   * @param {ReturnType<typeof indexTree>} index
   */
  function rowDomId(nodeId, instanceId, index) {
    return `${instanceId}-node-${index.ordinalById.get(nodeId)}`;
  }

  // Single mode shows the selection in the search input, and closing the
  // menu puts it back after a search that picked nothing.
  let seededValue = false;
  let prevSelectedText = "";
  $: {
    if (filterable && single) {
      if (!seededValue) {
        seededValue = true;
        if (value === "" && selectedText) value = selectedText;
      } else if (selectedText !== prevSelectedText) {
        value = selectedText;
      }
    }
    prevSelectedText = selectedText;
  }

  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || requiredError,
    warn,
    disabled,
    readonly,
  }));
  $: if (!required || hasFormValue) requiredError = false;
  $: shownInvalidText =
    requiredError && !invalid ? requiredInvalidText : invalidText;
  $: canClear = !readonly && hasSelection && (checkbox || clearable);
  $: statusDescribedById = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    helperText,
    invalidText: shownInvalidText,
    warnText,
    isFluid,
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
  $: menuAriaLabel =
    $$restProps["aria-label"] ?? (labelText || "Choose a node");
  $: tagSize =
    effectiveSize === "xs" || effectiveSize === "sm"
      ? effectiveSize
      : "default";

  $: fieldText = checkbox
    ? shownEntries.map((node) => nodeToString(node)).join(", ")
    : selectedText;

  const announceStatus = createStatusAnnouncer((text) => (statusText = text));
  $: if (hasNoRows && emptyText) announceStatus(emptyText);
  let prevResultCount = -1;
  $: if (searching) {
    const count = rows.length;
    if (count !== prevResultCount) {
      prevResultCount = count;
      if (count > 0) announceStatus(filterResultsText(count));
    }
  } else {
    prevResultCount = -1;
  }

  $: kindClass = checkbox
    ? "bx--multi-select"
    : filterable
      ? "bx--combo-box"
      : "bx--dropdown";
  $: treeSelectListBoxClass = [
    "bx--tree-select",
    kindClass,
    checkbox && filterable && "bx--combo-box",
    checkbox && filterable && "bx--multi-select--filterable",
    !checkbox && !filterable && showInvalid && "bx--dropdown--invalid",
    !checkbox && !filterable && showWarn && "bx--dropdown--warning",
    !checkbox && !filterable && open && "bx--dropdown--open",
    !checkbox && !filterable && readonly && "bx--dropdown--readonly",
    !checkbox && filterable && showWarn && "bx--combo-box--warning",
    !checkbox && filterable && readonly && "bx--combo-box--readonly",
    checkbox && showInvalid && "bx--multi-select--invalid",
    checkbox && readonly && "bx--multi-select--readonly",
    checkbox && selectionCount > 0 && "bx--multi-select--selected",
    placement === "top" && "bx--list-box--up",
    filterable && value && "bx--list-box--clearable",
    !filterable && canClear && single && "bx--list-box--clearable",
    !filterable && canClear && single && "bx--dropdown--clearable",
    open && highlightedId != null && "bx--list-box--option-highlighted",
    effectiveSize === "xs" && !checkbox && !filterable && "bx--dropdown--xs",
    effectiveSize === "sm" && !checkbox && !filterable && "bx--dropdown--sm",
    effectiveSize === "lg" && !checkbox && !filterable && "bx--dropdown--lg",
    effectiveSize === "xl" && !checkbox && !filterable && "bx--dropdown--xl",
    disabled && !checkbox && !filterable && "bx--dropdown--disabled",
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * Clear the selection programmatically.
   * By default, focuses the field afterwards. Set `options.focus` to `false`
   * to prevent that, or `options.open` to `true` to open the menu.
   * @type {(options?: { focus?: boolean; open?: boolean; }) => Promise<void>}
   * @example
   * ```svelte
   * <TreeSelect bind:this={treeSelect} {nodes} />
   * <button on:click={() => treeSelect.clear()}>Clear</button>
   * ```
   */
  export async function clear(options = {}) {
    if (readonly || !hasSelection) return;
    if (checkbox) {
      applyChecked([]);
    } else {
      selectedId = undefined;
    }
    open = false;
    announceStatus(selectionClearedText);
    await tick();
    if (options.open === true) open = true;
    if (options.focus !== false) (filterable ? inputRef : ref)?.focus();
  }

  function clearSearch() {
    if (single && hasSelection) {
      clear({ open: openOnClear });
      return;
    }
    value = "";
    open = false;
    // `bind:value` writes the DOM value without firing "input", so a
    // consumer's `on:input` would miss this clear.
    if (inputRef) {
      inputRef.value = "";
      inputRef.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  /** @param {KeyboardEvent} event */
  function clearFromKeyboard(event) {
    if (readonly || !canClear) return;
    event.preventDefault();
    dispatch("clear", event);
    clear({ open: openOnClear });
  }

  /**
   * Resolve a seed of checked ids against the tree. Ids of nodes a lazy
   * parent has not loaded stay at the end, so a saved check survives until
   * its node loads.
   * @param {ReadonlyArray<Node["id"]>} seed
   * @param {ReadonlyArray<Node>} tree
   * @param {ReturnType<typeof indexTree>} index
   */
  function resolveChecked(seed, tree, index) {
    const state = resolveCheckboxState(tree, seed, { cascade });
    const pending = unresolvedIds(seed, index);
    if (pending.length === 0) return state;
    return { ...state, checkedIds: [...state.checkedIds, ...pending] };
  }

  /** @param {ReadonlyArray<Node["id"]>} seed */
  function applyChecked(seed) {
    const state = resolveChecked(seed, viewNodes, treeIndex);
    const { added, removed } = diffIds(checkedIds, state.checkedIds);
    prevResolveNodes = viewNodes;
    prevResolveCascade = cascade;
    checkedIds = state.checkedIds;
    prevResolveChecked = checkedIds;
    indeterminateIds = state.indeterminateIds;
    if (added.length > 0 || removed.length > 0) {
      dispatch("check:change", {
        checkedIds: state.checkedIds,
        added,
        removed,
        indeterminateIds: state.indeterminateIds,
      });
      announceStatus(selectionCountText(selectionCountOf(state.checkedIds)));
    }
  }

  /** @param {ReadonlyArray<Node["id"]>} ids */
  function selectionCountOf(ids) {
    return shownCheckedIds(ids, cascade ? showChecked : "all", treeIndex)
      .length;
  }

  /** @param {Node} node */
  function toggleCheck(node) {
    if (readonly || node.disabled) return;
    applyChecked(
      toggleCheckboxNode(
        viewNodes,
        checkedIds,
        node.id,
        !checkedSet.has(node.id),
        { cascade },
      ),
    );
  }

  /** @param {Node} node */
  function selectNode(node) {
    if (readonly || node.disabled) return;
    if (node.id === selectedId) {
      open = false;
      return;
    }
    selectedId = node.id;
    dispatch("select", { selectedId: node.id, selectedNode: node });
    close("select");
  }

  /**
   * @param {Node["id"]} nodeId
   * @param {boolean} expanded
   */
  function setExpanded(nodeId, expanded) {
    if (searching) return;
    const node = treeIndex.byId.get(nodeId);
    if (!node || expandedIds.includes(nodeId) === expanded) return;
    expandedIds = expanded
      ? [...expandedIds, nodeId]
      : expandedIds.filter((expandedId) => expandedId !== nodeId);
    dispatch("toggle", { node, expanded });
    if (expanded) loadNode(node);
  }

  /** @param {Node} node */
  async function loadNode(node) {
    const isLazy =
      node.hasChildren === true && !(node.nodes && node.nodes.length > 0);
    if (!loadChildren || !isLazy || loadedChildren.has(node.id)) return;
    if (loadStates.get(node.id) === "loading") return;
    setLoadState(node.id, "loading");
    announceStatus(loadingNodeText(node));
    try {
      const children = (await loadChildren(node)) ?? [];
      if (destroyed) return;
      loadedChildren = new Map(loadedChildren).set(node.id, children);
      setLoadState(node.id, undefined);
      dispatch("load", { node, nodes: children });
      announceStatus(filterResultsText(children.length));
    } catch (error) {
      if (destroyed) return;
      setLoadState(node.id, "error");
      expandedIds = expandedIds.filter((expandedId) => expandedId !== node.id);
      dispatch("load:error", { node, error });
      announceStatus(loadErrorText(node));
    }
  }

  /**
   * @param {Node["id"]} nodeId
   * @param {"loading" | "error" | undefined} state
   */
  function setLoadState(nodeId, state) {
    const next = new Map(loadStates);
    if (state) next.set(nodeId, state);
    else next.delete(nodeId);
    loadStates = next;
  }

  /**
   * What Enter, Space or a click does to a row.
   * @param {import("./tree-select-rows.js").TreeSelectRow<Node>} row
   */
  function activateRow(row) {
    const node = treeIndex.byId.get(row.node.id);
    if (!node || node.disabled) return;
    if (checkbox) toggleCheck(node);
    else if (selectable === "leaf" && row.expandable) {
      setExpanded(node.id, !row.expanded);
    } else selectNode(node);
  }

  /**
   * @param {Event} event
   * @param {import("./tree-select-rows.js").TreeSelectRow<Node>} row
   */
  function handleRowClick(event, row) {
    // A label synthesizes a second click on its checkbox; without this the
    // toggle would run twice and net to no change.
    event.preventDefault();
    if (row.node.disabled) {
      event.stopPropagation();
      return;
    }
    highlightedIndex = rows.indexOf(row);
    activateRow(row);
  }

  /** @param {number} index */
  function highlightByPointer(index) {
    const row = rows[index];
    if (!row || row.node.disabled) return;
    highlightedIndex = index;
    highlightOrigin = "pointer";
  }

  /** @param {1 | -1} step */
  function change(step) {
    if (rows.length === 0) return;
    highlightedIndex = clampIndex(highlightedIndex, step, rows.length);
    highlightOrigin = "keyboard";
  }

  /** @param {1 | -1} step */
  function changePage(step) {
    highlightedIndex = clampIndex(
      highlightedIndex,
      step * MENU_PAGE_STEP,
      rows.length,
    );
    highlightOrigin = "keyboard";
  }

  /** @param {string} character */
  function typeaheadSearch(character) {
    if (rows.length === 0) return;
    highlightedIndex = typeaheadIndex({
      items: rows,
      query: typeahead.push(character),
      itemToString: (row) => nodeToString(row.node),
      isDisabled: (row) => Boolean(row.node.disabled),
      index: highlightedIndex,
    });
    highlightOrigin = "keyboard";
  }

  /**
   * Run `move` once an opening menu has rendered its rows.
   * @param {() => void} move
   */
  function whenOpen(move) {
    if (open) {
      move();
      return;
    }
    openMenu("keydown");
    tick().then(move);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    // Keys that belong to an IME composition are not menu keys.
    if (isImeComposition(event)) return;
    if (disabled) return;
    const key = inlineKey(
      event.key,
      $layoutDirection,
      /** @type {Element} */ (event.currentTarget),
    );
    // While a search is typed, plain Left and Right move the caret.
    const caretKeys = filterable && searching && !event.altKey;

    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      const step = key === "ArrowDown" ? 1 : -1;
      if (event.altKey) {
        if (key === "ArrowDown" && !open) openMenu("keydown");
        else if (key === "ArrowUp" && open) close("escape-key");
        return;
      }
      if (open) {
        change(step);
      } else {
        openMenu("keydown");
        // Opening highlights the selected node; start from an end only
        // when it left nothing highlighted.
        tick().then(() => {
          if (highlightedIndex === -1) change(step);
        });
      }
      return;
    }
    if ((key === "ArrowRight" || key === "ArrowLeft") && open && !caretKeys) {
      const row = highlightedRow;
      if (!row) return;
      event.preventDefault();
      if (key === "ArrowRight") {
        if (!row.expandable) return;
        if (row.expanded) change(1);
        else setExpanded(row.node.id, true);
      } else if (row.expanded && !searching) {
        setExpanded(row.node.id, false);
      } else if (row.parentId != null) {
        highlightedIndex = rows.findIndex(
          (candidate) => candidate.node.id === row.parentId,
        );
        highlightOrigin = "keyboard";
      }
      return;
    }
    if (key === "Enter" || (key === " " && !filterable)) {
      event.preventDefault();
      if (!open) {
        openMenu("keydown");
      } else if (highlightedRow && highlightOrigin === "keyboard") {
        activateRow(highlightedRow);
      } else if (key === "Enter") {
        close("escape-key");
      }
      return;
    }
    if (key === "Tab") {
      close("escape-key");
      return;
    }
    if (key === "Escape") {
      close("escape-key");
      return;
    }
    if (open && (key === "PageUp" || key === "PageDown")) {
      event.preventDefault();
      changePage(key === "PageDown" ? 1 : -1);
      return;
    }
    if (!filterable && (key === "Home" || key === "End")) {
      event.preventDefault();
      whenOpen(() => {
        if (rows.length === 0) return;
        highlightedIndex = key === "Home" ? 0 : rows.length - 1;
        highlightOrigin = "keyboard";
      });
      return;
    }
    if (!filterable && (key === "Delete" || key === "Backspace")) {
      clearFromKeyboard(event);
      return;
    }
    if (filterable && key === "Delete" && value === "") {
      clearFromKeyboard(event);
      return;
    }
    if (!filterable && isTypeaheadKey(event)) {
      event.preventDefault();
      const character = event.key;
      if (open) typeaheadSearch(character);
      else {
        openMenu("keydown");
        tick().then(() => typeaheadSearch(character));
      }
    }
  }

  /** @param {CustomEvent<{ tag: { value?: Node["id"] } }>} event */
  function handleTagClose({ detail }) {
    if (disabled || readonly) return;
    const tagId = detail.tag.value;
    if (tagId === undefined) return;
    const hadFocus = tagsRef?.contains(document.activeElement);
    applyChecked(
      toggleCheckboxNode(viewNodes, checkedIds, tagId, false, { cascade }),
    );
    // With no tag left to take focus, hand it back to the field.
    if (hadFocus && checkedIds.length === 0) {
      tick().then(() => (filterable ? inputRef : ref)?.focus());
    }
  }

  /** @param {Event} event */
  function handleOutsideInteraction(event) {
    if (
      open &&
      isOutsideClick(event, [wrapperRef, effectivePortalMenu && listRef])
    ) {
      close("outside-click");
    }
  }

  /** @param {Event} event */
  function handleMenuScroll(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    listScrollTop = target.scrollTop;
    menuWindow.noteScroll(target.scrollTop);
  }

  function handleFieldClick() {
    if (disabled) return;
    if (open) open = false;
    else openMenu("click");
  }
</script>

<div
  bind:this={wrapperRef}
  use:dismiss={{
    enabled: open,
    type: ["click", "focusin"],
    handler: handleOutsideInteraction,
  }}
  class:bx--tree-select__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--multi-select__wrapper={checkbox}
  class:bx--list-box__wrapper--fluid={isFluid}
  class:bx--list-box__wrapper--fluid--neutral={fluidNeutral}
  class:bx--list-box__wrapper--fluid--hoverable={fluidHoverable}
  class:bx--list-box__wrapper--fluid--invalid={isFluid && showInvalid}
  class:bx--list-box__wrapper--fluid--warning={isFluid && showWarn}
  class:bx--list-box__wrapper--fluid--disabled={isFluid && disabled}
  class:bx--list-box__wrapper--fluid--readonly={isFluid && readonly}
  class:bx--list-box__wrapper--fluid--condensed={isFluid && condensed}
  class:bx--multi-select--filterable__wrapper={isFluid &&
    checkbox &&
    filterable}
>
  {#if name}
    {#each formEntries as node (node.id)}
      <input type="hidden" {name} value={node.id} {disabled} {form} />
    {/each}
    {#each pendingIds as pendingId (pendingId)}
      <input type="hidden" {name} value={pendingId} {disabled} {form} />
    {/each}
    {#if single && !hasFormValue}
      <input type="hidden" {name} value="" {disabled} {form} />
    {/if}
  {/if}
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
    >
      <slot name="labelChildren">{labelText}</slot>
    </label>
  {/if}
  <ListBox
    class={treeSelectListBoxClass}
    {disabled}
    invalid={showInvalid}
    invalidText={isFluid ? "" : shownInvalidText}
    invalidId={errorId}
    {open}
    size={effectiveSize}
    warn={showWarn}
    warnText={isFluid ? "" : warnText}
    {warnId}
  >
    <!-- A single-mode search puts the icons after its input, as ComboBox
         does, so the rule that moves them clear of the clear button applies. -->
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
      <div
        style={isFluid ? undefined : "display: contents"}
        class:bx--list-box__field--wrapper={isFluid}
        class:bx--list-box__field--wrapper--input-focused={showFluidFieldFocus}
      >
        <div
          bind:this={fieldRef}
          class:bx--list-box__field={true}
          class:bx--list-box__field--wrapper--input-focused={!isFluid &&
            showFieldFocus}
        >
          {#if checkbox && selectionCount > 0}
            <ListBoxSelection
              {selectionCount}
              on:clear
              on:clear={() => clear({ open: openOnClear })}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
              class={tagSize === "default" ? undefined : `bx--tag--${tagSize}`}
            />
          {/if}
          <input
            bind:this={inputRef}
            bind:value
            aria-invalid={showInvalid ? "true" : undefined}
            aria-required={required ? "true" : undefined}
            {...$$restProps}
            role="combobox"
            tabindex="0"
            autocomplete="off"
            aria-autocomplete="list"
            aria-haspopup="tree"
            aria-expanded={open ? "true" : "false"}
            aria-activedescendant={highlightedId}
            aria-disabled={disabled ? "true" : undefined}
            aria-readonly={readonly ? "true" : undefined}
            aria-controls={open ? menuId : undefined}
            aria-describedby={fieldDescribedById}
            class:bx--text-input={true}
            class:bx--text-input--empty={value === ""}
            on:click={() => {
              if (disabled) return;
              openMenu("click");
            }}
            on:keydown
            on:keydown={(event) => {
              // Escape stays with `ListBox`, which stops it only when the
              // menu closes so an ancestor Modal stays open.
              if (event.key !== "Escape") event.stopPropagation();
              handleKeydown(event);
            }}
            on:input
            on:input={() => {
              if (!disabled && !readonly) openMenu("input");
            }}
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
            {placeholder}
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
          {#if value && !readonly}
            <ListBoxSelection
              on:clear={clearSearch}
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
      <!-- MultiSelect draws its focus ring on this wrapper; Dropdown's field
           carries it itself, so the wrapper only exists for fluid there. -->
      <div
        style={checkbox || isFluid ? undefined : "display: contents"}
        class:bx--list-box__field--wrapper={checkbox || isFluid}
        class:bx--list-box__field--wrapper--input-focused={checkbox || isFluid
          ? isFluid
            ? showFluidFieldFocus
            : showFieldFocus
          : false}
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
            // The native button would synthesize a click from these keys.
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
          {#if checkbox && selectionCount > 0}
            <ListBoxSelection
              {selectionCount}
              on:clear
              on:clear={() => clear({ open: openOnClear })}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
              class={tagSize === "default" ? undefined : `bx--tag--${tagSize}`}
            />
          {/if}
          <span class:bx--list-box__label={true} title={fieldText || undefined}
            >{fieldText || label || ""}</span
          >
          {#if single && canClear}
            <ListBoxSelection
              on:clear
              on:clear={() => clear({ open: openOnClear })}
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
        hasValue={hasFormValue}
        {disabled}
        {readonly}
        focusTarget={filterable ? inputRef : ref}
        {form}
        on:invalid={() => (requiredError = true)}
        on:reset={() => (requiredError = false)}
      />
    {/if}
    {#if open}
      <ListBoxMenu
        role="tree"
        aria-label={menuAriaLabel}
        {id}
        portal={effectivePortalMenu}
        portalHostClass="{kindClass} bx--tree-select bx--list-box--expanded"
        {open}
        anchor={filterable ? fieldRef : ref}
        {direction}
        {highlightedId}
        highlightScroll={highlightOrigin !== "pointer"}
        aria-multiselectable={checkbox ? "true" : undefined}
        aria-readonly={readonly ? "true" : undefined}
        aria-busy={loading ? "true" : undefined}
        on:scroll
        on:scroll={handleMenuScroll}
        on:mouseleave={() => {
          highlightedIndex = -1;
          highlightOrigin = null;
        }}
        bind:ref={listRef}
        style={isWindowed
          ? `max-height: ${menuMaxHeight}; overflow-y: auto;`
          : effectivePortalMenu
            ? `max-height: ${menuMaxHeight};`
            : undefined}
      >
        {#if isVirtualized}
          <VirtualWindow
            {totalHeight}
            {offsetY}
            scrollTop={listScrollTop}
            pinned={isPinned}
          >
            {#each itemsToRender as row (row.node.id)}
              {@const nodeId = row.node.id}
              <TreeSelectRow
                {row}
                treeId={id}
                ordinal={treeIndex.ordinalById.get(nodeId)}
                optionId={rowDomId(nodeId, id, treeIndex)}
                text={nodeToString(row.node)}
                {checkbox}
                checked={checkedSet.has(nodeId)}
                indeterminate={indeterminateSet.has(nodeId)}
                selected={selectedId === nodeId}
                {readonly}
                {searching}
                loadState={loadStates.get(nodeId)}
                errorText={loadStates.get(nodeId) === "error"
                  ? loadErrorText(row.node)
                  : ""}
                on:click={(event) => handleRowClick(event, row)}
                on:mousedown={(event) => {
                  // Keep focus on the field so screen readers don't
                  // re-announce it on every row click.
                  event.preventDefault();
                }}
                on:mouseenter={() => highlightByPointer(rows.indexOf(row))}
                on:toggle={() => setExpanded(nodeId, !row.expanded)}
              />
            {/each}
          </VirtualWindow>
        {:else}
          {#each itemsToRender as row (row.node.id)}
            {@const nodeId = row.node.id}
            <TreeSelectRow
              {row}
              treeId={id}
              ordinal={treeIndex.ordinalById.get(nodeId)}
              optionId={rowDomId(nodeId, id, treeIndex)}
              text={nodeToString(row.node)}
              {checkbox}
              checked={checkedSet.has(nodeId)}
              indeterminate={indeterminateSet.has(nodeId)}
              selected={selectedId === nodeId}
              {readonly}
              {searching}
              loadState={loadStates.get(nodeId)}
              errorText={loadStates.get(nodeId) === "error"
                ? loadErrorText(row.node)
                : ""}
              on:click={(event) => handleRowClick(event, row)}
              on:mousedown={(event) => {
                event.preventDefault();
              }}
              on:mouseenter={() => highlightByPointer(rows.indexOf(row))}
              on:toggle={() => setExpanded(nodeId, !row.expanded)}
            />
          {/each}
        {/if}
        {#if showEmpty}
          <ListBoxMenuStatus>
            <slot name="empty" {value}>{emptyText}</slot>
          </ListBoxMenuStatus>
        {/if}
        {#if loading}
          <ListBoxMenuStatus>
            <InlineLoading description={loadingText} />
          </ListBoxMenuStatus>
        {/if}
      </ListBoxMenu>
    {/if}
  </ListBox>
  {#if isFluid}
    <hr class:bx--list-box__divider={true} />
  {/if}
  {#if isFluid && showInvalid && shownInvalidText}
    <div id={errorId} class:bx--form-requirement={true} role="alert">
      {shownInvalidText}
    </div>
  {/if}
  {#if isFluid && showWarn && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
  {#if checkbox && selectionDisplay === "tags" && shownEntries.length > 0}
    <div bind:this={tagsRef} class:bx--multi-select__tags={true}>
      <TagSet
        id="{id}-tags"
        navigation="roving"
        multiline={tagOverflow === "wrap"}
        overflowMode="popover"
        size={tagSize}
        on:close:tag={handleTagClose}
      >
        {#each shownEntries.slice(0, tagLimit) as node (node.id)}
          <Tag
            filter={!readonly}
            disabled={disabled || !!node.disabled}
            value={node.id}
            title={removeTagText}
            maxWidth="13rem">{nodeToString(node)}</Tag
          >
        {/each}
        {#if shownEntries.length > tagLimit}
          <Tag type="outline"
            >{tagLimitText(shownEntries.length - tagLimit)}</Tag
          >
        {/if}
      </TagSet>
    </div>
  {/if}
  {#if !isFluid && !showInvalid && !showWarn && helperText}
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
  <!-- Live region for selection announcements. Always rendered (even while
       empty) so assistive tech registers the region before its text changes. -->
  <span role="status" aria-live="polite" class:bx--visually-hidden={true}
    >{statusText}</span
  >
</div>
