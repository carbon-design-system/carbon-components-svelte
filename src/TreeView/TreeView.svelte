<script context="module">
  function isUnderCollapsedSubtree(el) {
    return Boolean(el.closest("ul.bx--tree-node--hidden"));
  }

  /**
   * Whether a keydown event should feed the type-ahead search buffer:
   * a single printable character with no modifier (excludes Space, which
   * is reserved for selection).
   * @param {KeyboardEvent} event
   */
  function isTypeAheadKey(event) {
    return (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    );
  }

  /**
   * Creates a TreeWalker instance for keyboard navigation.
   * @returns {TreeWalker} A TreeWalker configured to navigate tree nodes
   */
  function createTreeWalkerInstance(root) {
    return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (!(node instanceof Element)) return NodeFilter.FILTER_SKIP;
        if (
          node.classList.contains("bx--tree-node--disabled") ||
          node.classList.contains("bx--tree-node--hidden")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        // Link rows render `role="treeitem"` on `<a class="bx--tree-node">`
        // inside `<li role="none">`, so we can't constrain by tag name.
        if (node.matches(".bx--tree-node")) {
          // Children stay mounted under a hidden subtree `ul`; skip so Arrow keys
          // follow visible rows only (same as when branches were unmounted).
          if (isUnderCollapsedSubtree(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });
  }

  /**
   * Sentinel parent id for top-level roots in
   * `cachedParentIdById` / `cachedChildIdsByParentId`.
   * Symbol so it cannot collide with a real `Node["id"]`.
   */
  const ROOT_PARENT_ID = Symbol("tree-view-root-parent");

  /**
   * Pre-order flatten of every node via an explicit stack.
   * @template {{ id: string | number; nodes?: TNode[] }} TNode
   * @param {ReadonlyArray<TNode>} nodes
   * @returns {Array<TNode>}
   */
  function traverse(nodes) {
    const out = [];
    /** @type {TNode[]} */
    const stack = [];
    for (let i = nodes.length - 1; i >= 0; i--) {
      stack.push(nodes[i]);
    }
    while (stack.length > 0) {
      const node = stack.pop();
      out.push(node);
      if (Array.isArray(node.nodes) && node.nodes.length > 0) {
        for (let i = node.nodes.length - 1; i >= 0; i--) {
          stack.push(node.nodes[i]);
        }
      }
    }
    return out;
  }

  /**
   * Like `traverse`, but only into expanded nodes.
   * Used for Shift+Click range selection over visible rows.
   * @template {{ id: string | number; nodes?: TNode[] }} TNode
   * @param {ReadonlyArray<TNode>} nodes
   * @param {Set<string | number>} expandedIdsSet
   * @returns {Array<TNode>}
   */
  function traverseVisible(nodes, expandedIdsSet) {
    const out = [];
    /** @type {Array<{ list: ReadonlyArray<TNode>; index: number }>} */
    const stack = [{ list: nodes, index: 0 }];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.index >= frame.list.length) {
        stack.pop();
        continue;
      }
      const node = frame.list[frame.index++];
      out.push(node);
      if (
        Array.isArray(node.nodes) &&
        node.nodes.length > 0 &&
        expandedIdsSet.has(node.id)
      ) {
        stack.push({ list: node.nodes, index: 0 });
      }
    }
    return out;
  }

  /**
   * Build node, parent, and child-id maps in one walk.
   * Leaves the flat array to `ensureFlatIndex`.
   * @template {{ id: string | number; nodes?: TNode[] }} TNode
   * @param {ReadonlyArray<TNode>} nodes
   * @returns {{
   *   nodeMap: Map<TNode["id"], TNode>,
   *   parentIdById: Map<TNode["id"], TNode["id"] | typeof ROOT_PARENT_ID>,
   *   childIdsByParentId: Map<TNode["id"] | typeof ROOT_PARENT_ID, Array<TNode["id"]>>,
   * }}
   */
  function buildTreeMaps(nodes) {
    /** @type {Map<TNode["id"], TNode>} */
    const nodeMap = new Map();
    /** @type {Map<TNode["id"], TNode["id"] | typeof ROOT_PARENT_ID>} */
    const parentIdById = new Map();
    /** @type {Map<TNode["id"] | typeof ROOT_PARENT_ID, Array<TNode["id"]>>} */
    const childIdsByParentId = new Map();

    const rootIds = [];
    for (const node of nodes) {
      rootIds.push(node.id);
    }
    childIdsByParentId.set(ROOT_PARENT_ID, rootIds);

    /** @type {Array<{ node: TNode; parentId: TNode["id"] | typeof ROOT_PARENT_ID }>} */
    const stack = [];
    for (let i = nodes.length - 1; i >= 0; i--) {
      stack.push({ node: nodes[i], parentId: ROOT_PARENT_ID });
    }
    while (stack.length > 0) {
      const { node, parentId } = stack.pop();
      nodeMap.set(node.id, node);
      parentIdById.set(node.id, parentId);
      if (Array.isArray(node.nodes) && node.nodes.length > 0) {
        const childIds = [];
        for (const child of node.nodes) {
          childIds.push(child.id);
        }
        childIdsByParentId.set(node.id, childIds);
        for (let i = node.nodes.length - 1; i >= 0; i--) {
          stack.push({ node: node.nodes[i], parentId: node.id });
        }
      }
    }

    return { nodeMap, parentIdById, childIdsByParentId };
  }

  /**
   * Ancestor ids from forest root to the parent of `id`.
   * Omits `id`. Empty for top-level roots and unknown ids.
   * @template {string | number} Id
   * @param {Id} id
   * @param {Map<Id, Id | typeof ROOT_PARENT_ID> | null} parentIdById
   * @returns {Id[]}
   */
  function getAncestorIds(id, parentIdById) {
    if (!parentIdById) return [];
    /** @type {Id[]} */
    const ancestors = [];
    let parentId = parentIdById.get(id);
    while (parentId != null && parentId !== ROOT_PARENT_ID) {
      ancestors.push(/** @type {Id} */ (parentId));
      parentId = parentIdById.get(/** @type {Id} */ (parentId));
    }
    ancestors.reverse();
    return ancestors;
  }

  /**
   * IDs to select for multiselect expansion from `node` (non-disabled only).
   * Disabled nodes are omitted; subtrees under a disabled node are not traversed.
   * @template {{ id: string | number; disabled?: boolean; nodes?: TNode[] }} TNode
   * @returns {Array<string | number>}
   */
  function multiselectExpansionIds(node, mode) {
    if (node.disabled) return [];
    if (mode === "node") {
      return [node.id];
    }
    if (mode === "shallow") {
      const out = [node.id];
      if (!Array.isArray(node.nodes)) return out;
      for (const c of node.nodes) {
        if (!c.disabled) out.push(c.id);
      }
      return out;
    }
    const out = [];
    /** @param {TNode} n */
    function walkDeep(n) {
      if (n.disabled) return;
      out.push(n.id);
      if (!Array.isArray(n.nodes)) return;
      for (const c of n.nodes) walkDeep(c);
    }
    walkDeep(node);
    return out;
  }
</script>

<script>
  /**
   * @generics {Node extends TreeNode<any> = TreeNode<any>} Node
   * @typedef {object} TreeNode<Id=(string|number)>
   * @property {Id} id
   * @property {any} text
   * @property {any} [icon]
   * @property {boolean} [disabled] - Whether the node is disabled
   * @property {string} [href] - Optional URL the node links to
   * @property {string} [target] - Optional link target (e.g., "_blank")
   * @property {boolean} [hasChildren] - Whether the node has children that have not been loaded yet. Renders an expander even without a `nodes` array; expanding fires `toggle` so children can be loaded lazily.
   * @property {TreeNode<Id>[]} [nodes]
   * @typedef {object} ShowNodeOptions
   * @property {boolean} [expand] - Whether to expand the node and its ancestors (default: true)
   * @property {boolean} [select] - Whether to select the node (default: true)
   * @property {boolean} [focus] - Whether to focus the node (default: true)
   * @typedef {object} TreeViewExpandedChange<Id=(string|number)>
   * @property {ReadonlyArray<Id>} expandedIds - The full set of expanded node ids after the change
   * @property {Array<Id>} added - Node ids expanded since the previous change
   * @property {Array<Id>} removed - Node ids collapsed since the previous change
   * @typedef {object} TreeViewSelectionChange<Id=(string|number)>
   * @property {ReadonlyArray<Id>} selectedIds - The full set of selected node ids after the change
   * @property {Array<Id>} added - Node ids selected since the previous change
   * @property {Array<Id>} removed - Node ids deselected since the previous change
   * @typedef {object} TreeViewCheckChange<Id=(string|number)>
   * @property {ReadonlyArray<Id>} checkedIds - The full set of checked node ids after the change
   * @property {Array<Id>} added - Node ids checked since the previous change
   * @property {Array<Id>} removed - Node ids unchecked since the previous change
   * @property {ReadonlyArray<Id>} indeterminateIds - The partially checked node ids after the change
   * @slot {{ node: Node & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean; } }}
   * @slot {{ node: Node & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean; } }} childNodes
   * @event select
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean }}
   * @event toggle
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean }}
   * @event toggle:change
   * @type {TreeViewExpandedChange<Node["id"]>}
   * @event focus
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean }}
   * @event select:change
   * @type {TreeViewSelectionChange<Node["id"]>}
   * @event check
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean }}
   * @event check:change
   * @type {TreeViewCheckChange<Node["id"]>}
   */

  /**
   * Provide an array of nodes to render.
   * @type {ReadonlyArray<Node>}
   */
  export let nodes = [];

  /**
   * Set the current active node id.
   * Only one node can be active.
   * @type {Node["id"]}
   * @bindable writable
   */
  export let activeId = "";

  /**
   * Set the node ids to be selected.
   * @type {ReadonlyArray<Node["id"]>}
   * @bindable writable
   */
  export let selectedIds = [];

  /**
   * Set the node ids to be expanded.
   * @type {ReadonlyArray<Node["id"]>}
   * @bindable writable
   */
  export let expandedIds = [];

  /**
   * Specify the TreeView size.
   * @type {"default" | "compact"}
   */
  export let size = "default";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Set to `true` to automatically collapse sibling nodes when expanding a node.
   * When enabled, only one node at each level can be expanded at a time.
   */
  export let autoCollapse = false;

  /**
   * Set to `true` to enable multi-select mode.
   * Supports Ctrl/Cmd+Click (toggle) and Shift+Click (range select).
   */
  export let multiselect = false;

  /**
   * When `multiselect` is true, `multiselectMode` controls how many nodes a selection gesture includes:
   * - `'node'`: only the clicked/active node (default)
   * - `'shallow'`: the node plus its direct non-disabled children
   * - `'deep'`: the node plus all non-disabled descendants
   * @type {'node' | 'shallow' | 'deep'}
   */
  export let multiselectMode = "node";

  /**
   * Specify how a selection is presented.
   * `"checkbox"` renders a tri-state checkbox on every node and implies
   * multi-selection; `multiselect` and `multiselectMode` are ignored in that mode.
   * @type {"highlight" | "checkbox"}
   */
  export let selectionMode = "highlight";

  /**
   * In `selectionMode="checkbox"`, `checkMode` controls how far a check propagates:
   * - `'node'`: only the clicked node; parents and children never follow each other
   * - `'deep'`: the node plus all non-disabled descendants, with ancestors deriving
   *   an indeterminate state (default)
   * @type {'node' | 'deep'}
   */
  export let checkMode = "deep";

  /**
   * The node ids that are checked in `selectionMode="checkbox"`. Distinct from
   * `selectedIds`, which tracks row highlighting and is unused in checkbox mode.
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
   * Programmatically expand all expandable nodes (those with loaded children
   * or `hasChildren: true`). Leaf ids are omitted — they do not affect
   * expansion.
   * @type {() => void}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.expandAll()}>Expand All</button>
   * ```
   */
  export function expandAll() {
    ensureFlatIndex();
    // Only expandable ids affect descent; leaf ids are no-ops and waste
    // memory on large trees.
    const expandableIds = [];
    for (const node of cachedFlattenedNodes) {
      if (isExpandableNode(node)) expandableIds.push(node.id);
    }
    expandedIdsSet = new Set(expandableIds);
    expandedIds = expandableIds;
    lastExpandedIdsRef = expandedIds;
  }

  /**
   * Programmatically collapse all nodes
   * @type {() => void}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.collapseAll()}>Collapse All</button>
   * ```
   */
  export function collapseAll() {
    expandedIdsSet.clear();
    expandedIds = [];
    lastExpandedIdsRef = expandedIds;
  }

  /**
   * Programmatically expand a subset of nodes.
   * Expands all nodes if no argument is provided.
   * Filter function should return `true` for nodes to expand. If not provided, expands all nodes.
   * @type {(filterNode?: (node: Node) => boolean) => void}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.expandNodes((node) => node.id.startsWith('folder-'))}>
   *   Expand Folders
   * </button>
   * ```
   */
  export function expandNodes(filterNode = () => true) {
    ensureFlatIndex();
    const nodesToExpand = cachedFlattenedNodes.filter(
      (node) =>
        isExpandableNode(node) &&
        (filterNode(node) ||
          node.nodes?.some((child) => filterNode(child) && child.nodes)),
    );
    for (const node of nodesToExpand) {
      expandedIdsSet.add(node.id);
    }
    expandedIds = Array.from(expandedIdsSet);
    lastExpandedIdsRef = expandedIds;
  }

  /**
   * Programmatically collapse a subset of nodes.
   * Collapses all nodes if no argument is provided.
   * Filter function should return `true` for nodes to collapse. If not provided, collapses all nodes.
   * @type {(filterNode?: (node: Node) => boolean) => void}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.collapseNodes((node) => node.id.startsWith('folder-'))}>
   *   Collapse Folders
   * </button>
   * ```
   */
  export function collapseNodes(filterNode = () => true) {
    ensureFlatIndex();
    for (const node of cachedFlattenedNodes) {
      if (expandedIdsSet.has(node.id) && filterNode(node)) {
        expandedIdsSet.delete(node.id);
      }
    }
    expandedIds = Array.from(expandedIdsSet);
    lastExpandedIdsRef = expandedIds;
  }

  /**
   * Programmatically show a node by `id`.
   * By default, the matching node will be expanded, selected, and focused.
   * Use the options parameter to customize this behavior.
   * @type {(id: Node["id"], options?: ShowNodeOptions) => void}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.showNode('node-123')}>
   *   Show Node
   * </button>
   * <button on:click={() => treeView.showNode('node-123', { expand: false, focus: false })}>
   *   Show Node (No Expand/Focus)
   * </button>
   * ```
   */
  export function showNode(id, options = {}) {
    const { expand = true, select = true, focus = true } = options;
    // cachedNodeMap rebuilds only when `nodes` identity changes.
    // In-place mutations stay invisible until then.
    const targetNode = cachedNodeMap?.get(id);
    if (!targetNode) return;

    if (expand) {
      const ancestorIds = getAncestorIds(id, cachedParentIdById);
      for (const ancestorId of ancestorIds) {
        expandedIdsSet.add(ancestorId);
      }
      expandedIds = Array.from(expandedIdsSet);
      lastExpandedIdsRef = expandedIds;
    }

    if (select) {
      activeId = id;
      if (selectionMode === "checkbox") {
        checkedIds = toggleCheckboxNode(nodes, checkedIds, id, true, {
          cascade: checkMode !== "node",
        });
      } else if (isMultiselect && multiselectMode !== "node") {
        setSelectedIds(multiselectExpansionIds(targetNode, multiselectMode));
      } else {
        setSelectedIds([id]);
      }
    }

    if (focus) {
      tick().then(() => {
        ref?.querySelector(`[id="${CSS.escape(String(id))}"]`)?.focus();
      });
    }
  }

  /**
   * Look up a node by `id` without re-implementing tree traversal.
   * Returns `null` if no node with the given `id` exists.
   * @type {(id: Node["id"]) => Node | null}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => console.log(treeView.getNode('node-123'))}>
   *   Log Node
   * </button>
   * ```
   */
  export function getNode(id) {
    return cachedNodeMap?.get(id) ?? null;
  }

  /**
   * Look up multiple nodes by `id`. Ids without a matching node are omitted.
   * @type {(ids: ReadonlyArray<Node["id"]>) => Array<Node>}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => console.log(treeView.getNodes(selectedIds))}>
   *   Log Selected Nodes
   * </button>
   * ```
   */
  export function getNodes(ids) {
    return ids.map((id) => cachedNodeMap?.get(id)).filter((node) => node);
  }

  import {
    afterUpdate,
    createEventDispatcher,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { writable } from "svelte/store";
  import {
    resolveCheckboxState,
    toggleCheckboxNode,
  } from "../utils/treeCheckboxState.js";
  import { isExpandableNode } from "../utils/isExpandableNode.js";
  import TreeViewNodeList from "./TreeViewNodeList.svelte";

  const dispatch = createEventDispatcher();
  const labelId = `label-${Math.random().toString(36)}`;
  const treeId = `tree-${Math.random().toString(36)}`;

  /** @type {import("svelte/store").Writable<boolean>} */
  const multiselectStore = writable(multiselect);
  /** @type {import("svelte/store").Writable<"highlight" | "checkbox">} */
  const selectionModeStore = writable(selectionMode);

  /** @type {import("svelte/store").Writable<Node["id"]>} */
  const activeNodeId = writable(activeId);
  /** @type {import("svelte/store").Writable<ReadonlyArray<Node["id"]>>} */
  const selectedNodeIds = writable(selectedIds);
  /** @type {import("svelte/store").Writable<ReadonlyArray<Node["id"]>>} */
  const expandedNodeIds = writable(expandedIds);
  /** @type {import("svelte/store").Writable<Set<Node["id"]>>} */
  const selectedIdsSetStore = writable(new Set(selectedIds));
  /** @type {import("svelte/store").Writable<Set<Node["id"]>>} */
  const checkedIdsSetStore = writable(new Set(checkedIds));
  /** @type {import("svelte/store").Writable<Set<Node["id"]>>} */
  const expandedIdsSetStore = writable(new Set(expandedIds));
  /** @type {import("svelte/store").Writable<Set<Node["id"]>>} */
  const indeterminateIdsSetStore = writable(new Set(indeterminateIds));

  /** @type {HTMLElement | null} */
  let ref = null;

  $: isCheckboxMode = selectionMode === "checkbox";
  // Checkbox mode is already multi-select; ignore highlight multiselect.
  $: isMultiselect = multiselect && !isCheckboxMode;

  /** While true (Ctrl/Cmd/Shift held), node labels use user-select: none for multiselect clicks. */
  let multiselectModifierActive = false;

  /** @param {KeyboardEvent} e */
  function syncModifierFromKeyboard(event) {
    if (!isMultiselect) return;
    multiselectModifierActive =
      event.ctrlKey || event.metaKey || event.shiftKey;
  }

  function clearMultiselectModifierKeys() {
    multiselectModifierActive = false;
  }

  /** @param {MouseEvent} e */
  function syncModifierFromTreeMouseDown(event) {
    if (!isMultiselect) return;
    multiselectModifierActive =
      event.ctrlKey || event.metaKey || event.shiftKey;
  }

  /** @param {Event} e */
  function handleMultiselectSelectStart(event) {
    if (isMultiselect && multiselectModifierActive) {
      event.preventDefault();
    }
  }

  function onDocumentVisibilityChange() {
    if (document.visibilityState === "hidden") {
      clearMultiselectModifierKeys();
    }
  }

  let multiselectKeyListenersAttached = false;

  /** @param {boolean} want */
  function setMultiselectKeyListeners(want) {
    if (want && !multiselectKeyListenersAttached) {
      window.addEventListener("keydown", syncModifierFromKeyboard, true);
      window.addEventListener("keyup", syncModifierFromKeyboard, true);
      window.addEventListener("blur", clearMultiselectModifierKeys);
      document.addEventListener("visibilitychange", onDocumentVisibilityChange);
      multiselectKeyListenersAttached = true;
    } else if (!want && multiselectKeyListenersAttached) {
      window.removeEventListener("keydown", syncModifierFromKeyboard, true);
      window.removeEventListener("keyup", syncModifierFromKeyboard, true);
      window.removeEventListener("blur", clearMultiselectModifierKeys);
      document.removeEventListener(
        "visibilitychange",
        onDocumentVisibilityChange,
      );
      multiselectKeyListenersAttached = false;
      multiselectModifierActive = false;
    }
  }

  $: setMultiselectKeyListeners(isMultiselect);

  /** @type {TreeWalker | null} */
  let treeWalker = null;

  /** @type {ReadonlyArray<Node> | null} */
  let cachedNodes = null;
  /** @type {Array<Node> | null} */
  let cachedFlattenedNodes = null;
  /** @type {Array<Node["id"]> | null} */
  let cachedNodeIds = null;
  /** @type {Map<Node["id"], Node> | null} */
  let cachedNodeMap = null;
  /** @type {Map<Node["id"], Node["id"] | typeof ROOT_PARENT_ID> | null} */
  let cachedParentIdById = null;
  /** @type {Map<Node["id"] | typeof ROOT_PARENT_ID, Array<Node["id"]>> | null} */
  let cachedChildIdsByParentId = null;

  /**
   * Finds sibling node IDs for a given node ID using the precomputed
   * parent/child-id caches (rebuilt alongside `cachedNodeMap` whenever
   * `nodes` changes identity). O(1) map lookups plus the sibling count,
   * instead of a fresh full-tree traversal per call.
   * @type {(id: Node["id"]) => Array<Node["id"]>}
   */
  function getCachedSiblingIds(id) {
    const parentId = cachedParentIdById?.get(id);
    const childIds = cachedChildIdsByParentId?.get(parentId);
    if (!childIds) return [];
    return childIds.filter((childId) => childId !== id);
  }

  /**
   * Build `cachedFlattenedNodes` and `cachedNodeIds` when expand APIs
   * need them. The `nodes` reactive path only builds maps.
   */
  function ensureFlatIndex() {
    if (cachedFlattenedNodes != null) return;
    cachedFlattenedNodes = traverse(nodes);
    cachedNodeIds = cachedFlattenedNodes.map((node) => node.id);
  }

  /** @type {Node["id"] | null} */
  let anchorId = null;

  /** @type {Set<Node["id"]>} */
  let expandedIdsSet = new Set(expandedIds);
  /** @type {ReadonlyArray<Node["id"]>} */
  let lastExpandedIdsRef = expandedIds;
  /** @type {Set<Node["id"]>} */
  let selectedIdsSet = new Set(selectedIds);
  /** @type {ReadonlyArray<Node["id"]>} */
  let lastSelectedIdsRef = selectedIds;
  /** @type {Node["id"]} */
  let lastActiveIdPushed = activeId;
  /** @type {ReadonlyArray<Node["id"]>} */
  let lastSelectedIdsPushed = selectedIds;
  /** @type {ReadonlyArray<Node["id"]>} */
  let lastExpandedIdsPushed = expandedIds;

  /**
   * @returns {boolean}
   */
  function arrayIdsEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Re-derive the `expanded`/`selected`/`checked`/`indeterminate` flags from
   * the source-of-truth state at dispatch time. The `node` object passed by
   * the child components is computed reactively, so its flags still reflect
   * the pre-action state when a handler mutates
   * `selectedIds`/`checkedIds`/`expandedIds` and then dispatches synchronously.
   * @type {(node: Node) => Node & { expanded: boolean; selected: boolean; checked: boolean; indeterminate: boolean }}
   */
  function withLiveState(node) {
    return {
      ...node,
      expanded: expandedIdsSet.has(node.id),
      selected: selectedIdsSet.has(node.id),
      checked: checkedIds.includes(node.id),
      indeterminate: indeterminateIds.includes(node.id),
    };
  }

  /**
   * Reassign `selectedIds` and keep `selectedIdsSet` (used for O(1) lookups
   * in `withLiveState`) synchronously in sync. `selectedIdsSetStore` is only
   * refreshed reactively (see below), which lags behind handlers that mutate
   * `selectedIds` and dispatch in the same synchronous call, so it can't be
   * used for `withLiveState`.
   * @type {(next: ReadonlyArray<Node["id"]>) => void}
   */
  function setSelectedIds(next) {
    selectedIds = next;
    selectedIdsSet = new Set(next);
    lastSelectedIdsRef = next;
  }

  /** @type {(node: Node, event?: Event) => void} */
  function clickNode(node, event) {
    activeId = node.id;

    // Link nodes have no checkbox; they fire `select` like highlight mode.
    if (selectionMode === "checkbox") {
      if (node.href !== undefined) {
        dispatch("select", withLiveState(node));
        return;
      }

      // The checkbox label synthesizes a second click on the hidden input
      // with `detail: 0`. Real pointer clicks have `detail >= 1`, so skip
      // the forwarded one to avoid toggling twice.
      const isForwardedLabelClick =
        event?.target instanceof HTMLInputElement && event.detail === 0;

      if (isForwardedLabelClick) return;

      // Enter/Space always toggles. Pointer clicks only toggle when they
      // hit the checkbox, not the rest of the row.
      const isKeyboardActivation = event?.type === "keydown";
      const clickedCheckbox =
        isKeyboardActivation ||
        event?.target?.closest?.(".bx--checkbox-wrapper") != null;

      if (!clickedCheckbox) return;

      checkedIds = toggleCheckboxNode(
        nodes,
        checkedIds,
        node.id,
        !checkedIds.includes(node.id),
        { cascade: checkMode !== "node" },
      );
      dispatch("check", withLiveState(node));
      return;
    }

    const mode =
      isMultiselect && multiselectMode !== "node" ? multiselectMode : "node";

    if (isMultiselect && event) {
      const isMeta =
        /** @type {MouseEvent | KeyboardEvent} */ (event).metaKey ||
        /** @type {MouseEvent | KeyboardEvent} */ (event).ctrlKey;
      const isShift = /** @type {MouseEvent | KeyboardEvent} */ (event)
        .shiftKey;

      if (isMeta && !isShift) {
        const expansion = multiselectExpansionIds(node, mode);
        const expansionSet = new Set(expansion);
        const currentSet = new Set(selectedIds);
        if (currentSet.has(node.id)) {
          for (const id of expansionSet) currentSet.delete(id);
        } else {
          for (const id of expansionSet) currentSet.add(id);
        }
        setSelectedIds(Array.from(currentSet));
        anchorId = node.id;
      } else if (isShift && anchorId != null) {
        const visibleIds = traverseVisible(nodes, expandedIdsSet)
          .filter((n) => !n.disabled)
          .map((n) => n.id);
        const anchorIndex = visibleIds.indexOf(anchorId);
        const currentIndex = visibleIds.indexOf(node.id);
        if (anchorIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(anchorIndex, currentIndex);
          const end = Math.max(anchorIndex, currentIndex);
          const sliceIds = visibleIds.slice(start, end + 1);
          if (mode === "node") {
            setSelectedIds(sliceIds);
          } else {
            const ordered = [];
            const seen = new Set();
            for (const id of sliceIds) {
              const n = cachedNodeMap?.get(id);
              if (!n) continue;
              for (const eid of multiselectExpansionIds(n, mode)) {
                if (!seen.has(eid)) {
                  seen.add(eid);
                  ordered.push(eid);
                }
              }
            }
            setSelectedIds(ordered);
          }
        } else {
          setSelectedIds(multiselectExpansionIds(node, mode));
          anchorId = node.id;
        }
      } else {
        setSelectedIds(multiselectExpansionIds(node, mode));
        anchorId = node.id;
      }
    } else {
      setSelectedIds([node.id]);
    }

    dispatch("select", withLiveState(node));
  }

  /** @type {(node: Node) => void} */
  function selectNode(node) {
    // Focus movement must not check the node in checkbox mode.
    if (selectionMode === "checkbox") return;

    if (isMultiselect) {
      const mode = multiselectMode === "node" ? "node" : multiselectMode;
      const expansion = multiselectExpansionIds(node, mode);
      const set = new Set(selectedIds);
      for (const id of expansion) set.add(id);
      setSelectedIds(Array.from(set));
    } else {
      setSelectedIds([node.id]);
    }
  }

  /** @type {(node: Node, expanded: boolean) => void} */
  function expandNode(node, expanded) {
    if (expanded) {
      let removedSibling = false;
      if (autoCollapse) {
        const siblingIds = getCachedSiblingIds(node.id);
        for (const siblingId of siblingIds) {
          if (expandedIdsSet.delete(siblingId)) removedSibling = true;
        }
      }
      const added = !expandedIdsSet.has(node.id);
      if (added) expandedIdsSet.add(node.id);
      if (!added && !removedSibling) return;
      // Bulk sibling collapse needs a full copy; single-id toggles append.
      expandedIds = removedSibling
        ? Array.from(expandedIdsSet)
        : [...expandedIds, node.id];
    } else {
      if (!expandedIdsSet.has(node.id)) return;
      expandedIdsSet.delete(node.id);
      expandedIds = expandedIds.filter((id) => id !== node.id);
    }
    lastExpandedIdsRef = expandedIds;
  }

  /** @type {(node: Node) => void} */
  function focusNode(node) {
    dispatch("focus", withLiveState(node));
  }

  /** @type {(node: Node) => void} */
  function toggleNode(node) {
    dispatch("toggle", withLiveState(node));
  }

  setContext("carbon:TreeView", {
    treeId,
    activeNodeId,
    selectedNodeIds,
    expandedNodeIds,
    selectedIdsSetStore,
    checkedIdsSetStore,
    expandedIdsSetStore,
    indeterminateIdsSetStore,
    multiselectStore,
    selectionModeStore,
    clickNode,
    selectNode,
    expandNode,
    focusNode,
    toggleNode,
  });

  /** @param {HTMLElement | null} root */
  function resetNodeTabIndices(root) {
    if (!root) return;
    const items = root.querySelectorAll('[tabindex="0"]');
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      if (el instanceof HTMLElement) el.tabIndex = -1;
    }
  }

  function getTreeItemFromTarget(target) {
    if (!(target instanceof Element)) return null;
    if (target.classList.contains("bx--tree-node")) return target;
    return target.closest(".bx--tree-node");
  }

  /** Type-ahead search buffer, reset after `typeAheadTimeoutMs` of inactivity. */
  let typeAheadBuffer = "";
  let typeAheadTimeoutId = null;
  const typeAheadTimeoutMs = 500;

  /** @returns {Element[]} Visible (non-disabled, non-hidden) tree items in document order. */
  function collectVisibleTreeItems() {
    if (!treeWalker || !ref) return [];
    treeWalker.currentNode = ref;
    /** @type {Element[]} */
    const items = [];
    let n = treeWalker.nextNode();
    while (n) {
      items.push(n);
      n = treeWalker.nextNode();
    }
    return items;
  }

  /**
   * Moves focus to the next visible node whose label starts with the
   * typed search string, cycling from the current item. Repeating the
   * same character (e.g. "bbb") cycles through matches for that letter,
   * matching native `<select>`-style type-ahead.
   * @param {KeyboardEvent} event
   * @param {Element} treeItem
   * @returns {boolean} Whether the event was handled as type-ahead input.
   */
  function handleTypeAhead(event, treeItem) {
    if (!isTypeAheadKey(event)) return false;

    if (typeAheadTimeoutId) clearTimeout(typeAheadTimeoutId);
    typeAheadBuffer += event.key.toLowerCase();
    typeAheadTimeoutId = setTimeout(() => {
      typeAheadBuffer = "";
    }, typeAheadTimeoutMs);

    const isRepeatedChar =
      typeAheadBuffer.length > 1 &&
      [...typeAheadBuffer].every((c) => c === typeAheadBuffer[0]);
    const query = isRepeatedChar ? typeAheadBuffer[0] : typeAheadBuffer;

    const items = collectVisibleTreeItems();
    if (items.length === 0) return true;

    const startIndex = Math.max(items.indexOf(treeItem), 0);

    for (let offset = 1; offset <= items.length; offset++) {
      const candidate = items[(startIndex + offset) % items.length];
      const label = (candidate.textContent ?? "").trim().toLowerCase();
      if (label.startsWith(query)) {
        resetNodeTabIndices(ref);
        if (candidate instanceof HTMLElement) {
          candidate.tabIndex = 0;
          candidate.focus();
        }
        break;
      }
    }

    return true;
  }

  function handleKeyDown(event) {
    event.stopPropagation();

    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
    }

    if (!treeWalker || !ref) return;

    const treeItem = getTreeItemFromTarget(event.target);
    if (!treeItem) return;

    if (handleTypeAhead(event, treeItem)) return;

    treeWalker.currentNode = treeItem;

    /** @type {Node | null} */
    let nextFocusNode = null;

    if (event.key === "ArrowUp") {
      nextFocusNode = treeWalker.previousNode();
    }
    if (event.key === "ArrowDown") {
      nextFocusNode = treeWalker.nextNode();
    }

    const isHomeOrEnd = event.key === "Home" || event.key === "End";
    const isSelectAll =
      (event.code === "KeyA" || event.key === "a" || event.key === "A") &&
      event.ctrlKey;

    if (isHomeOrEnd || isSelectAll) {
      /** @type {Array<string | number>} */
      const nodeIds = [];

      if (isHomeOrEnd) {
        if (
          isMultiselect &&
          event.shiftKey &&
          event.ctrlKey &&
          treeItem instanceof HTMLElement
        ) {
          const hid = treeItem.id;
          if (hid) nodeIds.push(hid);
        }
        while (
          event.key === "Home"
            ? treeWalker.previousNode()
            : treeWalker.nextNode()
        ) {
          nextFocusNode = treeWalker.currentNode;
          if (
            isMultiselect &&
            event.shiftKey &&
            event.ctrlKey &&
            nextFocusNode instanceof Element
          ) {
            const nid = nextFocusNode.id;
            if (nid) nodeIds.push(nid);
          }
        }
      }

      if (isSelectAll) {
        event.preventDefault();
        ensureFlatIndex();
        const visibleEls = new Map(
          Array.from(
            ref?.querySelectorAll(
              '[role="treeitem"]:not(.bx--tree-node--hidden)',
            ) ?? [],
          ).map((el) => [el.id, el]),
        );
        for (const n of cachedFlattenedNodes) {
          if (n.disabled) continue;
          const el = visibleEls.get(String(n.id));
          if (!el || isUnderCollapsedSubtree(el)) continue;
          nodeIds.push(n.id);
        }
      }

      setSelectedIds([...new Set(selectedIds.concat(nodeIds))]);
    }

    if (nextFocusNode && nextFocusNode !== treeItem) {
      resetNodeTabIndices(ref);
      if (nextFocusNode instanceof HTMLElement) {
        nextFocusNode.tabIndex = 0;
        nextFocusNode.focus();
      }
    }
  }

  /** @type {ReadonlyArray<Node> | null} */
  let prevNodesForFirstTab = null;

  afterUpdate(() => {
    if (!ref) return;
    if (nodes === prevNodesForFirstTab) return;
    prevNodesForFirstTab = nodes;

    const firstFocusableNode = ref.querySelector(
      ".bx--tree-node:not(.bx--tree-node--disabled):not(.bx--tree-node--hidden)",
    );

    if (firstFocusableNode instanceof HTMLElement) {
      firstFocusableNode.tabIndex = 0;
    }
  });

  onMount(() => {
    if (ref && !treeWalker) {
      treeWalker = createTreeWalkerInstance(ref);
    }

    return () => {
      setMultiselectKeyListeners(false);
      if (typeAheadTimeoutId) clearTimeout(typeAheadTimeoutId);
    };
  });

  $: if (nodes !== cachedNodes) {
    cachedNodes = nodes;
    const maps = buildTreeMaps(nodes);
    cachedNodeMap = maps.nodeMap;
    cachedParentIdById = maps.parentIdById;
    cachedChildIdsByParentId = maps.childIdsByParentId;
    // Flat list stays null until expandAll / expandNodes / collapseNodes / Ctrl+A.
    cachedFlattenedNodes = null;
    cachedNodeIds = null;
  }

  $: multiselectStore.set(isMultiselect);
  $: selectionModeStore.set(selectionMode);

  /** @type {ReadonlyArray<Node["id"]>} */
  let lastIndeterminateIdsPushed = indeterminateIds;
  /** @type {ReadonlyArray<Node["id"]>} */
  let lastCheckedIdsPushed = checkedIds;

  // Depend on `cachedNodes` so this runs after the cache refresh, and write
  // `checkedIds` so the sync block below sees the settled state.
  $: {
    if (selectionMode === "checkbox") {
      const checkboxState = resolveCheckboxState(
        cachedNodes ?? nodes,
        checkedIds,
        {
          cascade: checkMode !== "node",
        },
      );
      if (!arrayIdsEqual(checkboxState.checkedIds, checkedIds)) {
        checkedIds = checkboxState.checkedIds;
      }
      if (!arrayIdsEqual(checkboxState.indeterminateIds, indeterminateIds)) {
        indeterminateIds = checkboxState.indeterminateIds;
      }
    } else if (indeterminateIds.length > 0) {
      indeterminateIds = [];
    }

    if (!arrayIdsEqual(indeterminateIds, lastIndeterminateIdsPushed)) {
      lastIndeterminateIdsPushed = indeterminateIds;
      indeterminateIdsSetStore.set(new Set(indeterminateIds));
    }

    if (!arrayIdsEqual(checkedIds, lastCheckedIdsPushed)) {
      const prevCheckedIds = lastCheckedIdsPushed;
      lastCheckedIdsPushed = checkedIds;
      checkedIdsSetStore.set(new Set(checkedIds));

      const nextCheckedIds = checkedIds.slice();
      const nextIndeterminateIds = indeterminateIds.slice();
      const prevSet = new Set(prevCheckedIds);
      const nextSet = new Set(nextCheckedIds);
      const added = nextCheckedIds.filter((id) => !prevSet.has(id));
      const removed = prevCheckedIds.filter((id) => !nextSet.has(id));
      tick().then(() => {
        dispatch("check:change", {
          checkedIds: nextCheckedIds,
          added,
          removed,
          indeterminateIds: nextIndeterminateIds,
        });
      });
    }
  }

  let prevActiveIdForAutoCollapse = activeId;

  $: {
    if (expandedIds !== lastExpandedIdsRef) {
      expandedIdsSet = new Set(expandedIds);
      lastExpandedIdsRef = expandedIds;
    }

    // Catches `selectedIds` reassignments that didn't go through
    // `setSelectedIds` (e.g. an external `bind:selectedIds` update).
    if (selectedIds !== lastSelectedIdsRef) {
      selectedIdsSet = new Set(selectedIds);
      lastSelectedIdsRef = selectedIds;
    }

    // `autoCollapse` should also be triggered when activeId changes programmatically.
    if (autoCollapse && activeId !== prevActiveIdForAutoCollapse) {
      prevActiveIdForAutoCollapse = activeId;

      if (cachedNodeMap?.has(activeId)) {
        const ancestorIds = getAncestorIds(activeId, cachedParentIdById);

        // For each ancestor, collapse its siblings.
        for (const ancestorId of ancestorIds) {
          const siblingIds = getCachedSiblingIds(ancestorId);
          for (const siblingId of siblingIds) {
            expandedIdsSet.delete(siblingId);
          }
          expandedIdsSet.add(ancestorId);
        }

        expandedIds = Array.from(expandedIdsSet);
        lastExpandedIdsRef = expandedIds;
      }
    }

    if (activeId !== lastActiveIdPushed) {
      lastActiveIdPushed = activeId;
      activeNodeId.set(activeId);
    }
    if (!arrayIdsEqual(selectedIds, lastSelectedIdsPushed)) {
      const prevSelectedIds = lastSelectedIdsPushed;
      lastSelectedIdsPushed = selectedIds;
      selectedIdsSetStore.set(new Set(selectedIds));
      selectedNodeIds.set(selectedIds);

      const nextSelectedIds = selectedIds.slice();
      const prevSet = new Set(prevSelectedIds);
      const nextSet = new Set(nextSelectedIds);
      const added = nextSelectedIds.filter((id) => !prevSet.has(id));
      const removed = prevSelectedIds.filter((id) => !nextSet.has(id));
      tick().then(() => {
        dispatch("select:change", {
          selectedIds: nextSelectedIds,
          added,
          removed,
        });
      });
    }
    if (!arrayIdsEqual(expandedIds, lastExpandedIdsPushed)) {
      const prevExpandedIds = lastExpandedIdsPushed;
      lastExpandedIdsPushed = expandedIds;
      expandedIdsSetStore.set(expandedIdsSet);
      expandedNodeIds.set(expandedIds);

      const nextExpandedIds = expandedIds.slice();
      const prevSet = new Set(prevExpandedIds);
      const nextSet = new Set(nextExpandedIds);
      const added = nextExpandedIds.filter((id) => !prevSet.has(id));
      const removed = prevExpandedIds.filter((id) => !nextSet.has(id));
      tick().then(() => {
        dispatch("toggle:change", {
          expandedIds: nextExpandedIds,
          added,
          removed,
        });
      });
    }
  }
</script>

{#if !hideLabel}
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label id={labelId} class:bx--label={true}>
    <slot name="labelChildren">{labelText}</slot>
  </label>
{/if}

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<ul
  {...$$restProps}
  role="tree"
  bind:this={ref}
  class:bx--tree={true}
  class:bx--tree--default={size === "default"}
  class:bx--tree--compact={size === "compact"}
  class:bx--tree--multiselect={isMultiselect}
  class:bx--tree--checkbox={isCheckboxMode}
  class:bx--tree--multiselect-modifier={isMultiselect &&
    multiselectModifierActive}
  aria-label={hideLabel ? labelText : undefined}
  aria-labelledby={hideLabel ? undefined : labelId}
  aria-multiselectable={isMultiselect || isCheckboxMode || undefined}
  on:mousedown|capture={syncModifierFromTreeMouseDown}
  on:selectstart|capture={handleMultiselectSelectStart}
  on:keydown
  on:keydown|stopPropagation={handleKeyDown}
>
  <TreeViewNodeList root {nodes} let:node>
    <slot {node}> {node.text} </slot>
    <svelte:fragment slot="childNodes" let:node>
      <slot name="childNodes" {node} />
    </svelte:fragment>
  </TreeViewNodeList>
</ul>
