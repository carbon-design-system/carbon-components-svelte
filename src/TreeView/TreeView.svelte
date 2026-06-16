<script context="module">
  /**
   * Depth-first search to find a node by id; returns an array
   * of nodes from the initial node to the matching leaf.
   * @template {{ id: string | number; nodes?: TNode[] }} TNode
   * @returns {null | TNode[]}
   */
  function findNodeById(node, id) {
    if (node === null) return null;
    if (node.id === id) return [node];
    if (!Array.isArray(node.nodes)) {
      return null;
    }

    for (const child of node.nodes) {
      const nodes = findNodeById(child, id);

      if (Array.isArray(nodes)) {
        nodes.unshift(node);
        return nodes;
      }
    }

    return null;
  }

  function isUnderCollapsedSubtree(el) {
    return Boolean(el.closest("ul.bx--tree-node--hidden"));
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
   * Recursively flattens a tree of nodes into a single array
   * @template {object} Node
   * @returns {Array<Node>}
   */
  function traverse(nodes) {
    return nodes.reduce((acc, node) => {
      acc.push(node);
      if (Array.isArray(node.nodes) && node.nodes.length > 0) {
        acc.push(...traverse(node.nodes));
      }
      return acc;
    }, []);
  }

  /**
   * Like `traverse` but only descends into expanded nodes.
   * Used for Shift+Click range selection (only visible nodes).
   * @template {object} Node
   * @returns {Array<Node>}
   */
  function traverseVisible(nodes, expandedIdsSet) {
    return nodes.reduce((acc, node) => {
      acc.push(node);
      if (
        Array.isArray(node.nodes) &&
        node.nodes.length > 0 &&
        expandedIdsSet.has(node.id)
      ) {
        acc.push(...traverseVisible(node.nodes, expandedIdsSet));
      }
      return acc;
    }, []);
  }

  /**
   * Finds sibling node IDs for a given node ID within a tree structure.
   * @template {{ id: string | number; nodes?: TNode[] }} TNode
   * @returns {Array<string | number>} Array of sibling IDs (excluding the node itself)
   */
  function findSiblingIds(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) {
        const siblings = [];
        for (const n of nodes) {
          if (n.id !== id) {
            siblings.push(n.id);
          }
        }
        return siblings;
      }
    }

    for (const node of nodes) {
      if (Array.isArray(node.nodes)) {
        for (const child of node.nodes) {
          if (child.id === id) {
            const siblings = [];
            for (const n of node.nodes) {
              if (n.id !== id) {
                siblings.push(n.id);
              }
            }
            return siblings;
          }
        }

        const result = findSiblingIds(node.nodes, id);
        if (result.length > 0) {
          return result;
        }
      }
    }

    return [];
  }

  /**
   * Finds a node by id across top-level tree roots.
   * @template {{ id: string | number; disabled?: boolean; nodes?: TNode[] }} TNode
   * @returns {TNode | null}
   */
  function findForestNodeById(roots, id) {
    for (const child of roots) {
      const path = findNodeById(child, id);
      if (path) return path[path.length - 1];
    }
    return null;
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
   * @property {TreeNode<Id>[]} [nodes]
   * @typedef {object} ShowNodeOptions
   * @property {boolean} [expand] - Whether to expand the node and its ancestors (default: true)
   * @property {boolean} [select] - Whether to select the node (default: true)
   * @property {boolean} [focus] - Whether to focus the node (default: true)
   * @typedef {object} TreeViewExpandedChange<Id=(string|number)>
   * @property {ReadonlyArray<Id>} expandedIds - The full set of expanded node ids after the change
   * @property {Array<Id>} added - Node ids expanded since the previous change
   * @property {Array<Id>} removed - Node ids collapsed since the previous change
   * @slot {{ node: Node & { expanded: boolean; leaf: boolean; selected: boolean; } }}
   * @event select
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
   * @event toggle
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
   * @event toggle:change
   * @type {TreeViewExpandedChange<Node["id"]>}
   * @event focus
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
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
   * Programmatically expand all nodes
   * @type {() => void}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.expandAll()}>Expand All</button>
   * ```
   */
  export function expandAll() {
    expandedIdsSet = new Set(nodeIds);
    expandedIds = Array.from(expandedIdsSet);
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
    const nodesToExpand = flattenedNodes
      .filter(
        (node) =>
          filterNode(node) ||
          node.nodes?.some((child) => filterNode(child) && child.nodes),
      )
      .map((node) => node.id);
    for (const id of nodesToExpand) {
      expandedIdsSet.add(id);
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
    for (const node of flattenedNodes) {
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

    for (const child of nodes) {
      const path = findNodeById(child, id);

      if (path) {
        const ids = path.map((node) => node.id);
        const lastId = ids[ids.length - 1];

        if (expand) {
          const ancestorIds = ids.slice(0, -1);
          for (const ancestorId of ancestorIds) {
            expandedIdsSet.add(ancestorId);
          }
          expandedIds = Array.from(expandedIdsSet);
          lastExpandedIdsRef = expandedIds;
        }

        if (select) {
          activeId = lastId;
          const targetNode = path[path.length - 1];
          if (multiselect && multiselectMode !== "node") {
            selectedIds = multiselectExpansionIds(targetNode, multiselectMode);
          } else {
            selectedIds = [lastId];
          }
        }

        if (focus) {
          tick().then(() => {
            ref?.querySelector(`[id="${CSS.escape(lastId)}"]`)?.focus();
          });
        }

        break;
      }
    }
  }

  import {
    afterUpdate,
    createEventDispatcher,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { writable } from "svelte/store";
  import TreeViewNodeList from "./TreeViewNodeList.svelte";

  const dispatch = createEventDispatcher();
  const labelId = `label-${Math.random().toString(36)}`;
  const treeId = `tree-${Math.random().toString(36)}`;

  /** @type {import("svelte/store").Writable<boolean>} */
  const multiselectStore = writable(multiselect);

  /** @type {import("svelte/store").Writable<Node["id"]>} */
  const activeNodeId = writable(activeId);
  /** @type {import("svelte/store").Writable<ReadonlyArray<Node["id"]>>} */
  const selectedNodeIds = writable(selectedIds);
  /** @type {import("svelte/store").Writable<ReadonlyArray<Node["id"]>>} */
  const expandedNodeIds = writable(expandedIds);
  /** @type {import("svelte/store").Writable<Set<Node["id"]>>} */
  const selectedIdsSetStore = writable(new Set(selectedIds));
  /** @type {import("svelte/store").Writable<Set<Node["id"]>>} */
  const expandedIdsSetStore = writable(new Set(expandedIds));

  /** @type {HTMLElement | null} */
  let ref = null;

  /** While true (Ctrl/Cmd/Shift held), node labels use user-select: none for multiselect clicks. */
  let multiselectModifierActive = false;

  /** @param {KeyboardEvent} e */
  function syncModifierFromKeyboard(event) {
    if (!multiselect) return;
    multiselectModifierActive =
      event.ctrlKey || event.metaKey || event.shiftKey;
  }

  function clearMultiselectModifierKeys() {
    multiselectModifierActive = false;
  }

  /** @param {MouseEvent} e */
  function syncModifierFromTreeMouseDown(event) {
    if (!multiselect) return;
    multiselectModifierActive =
      event.ctrlKey || event.metaKey || event.shiftKey;
  }

  /** @param {Event} e */
  function handleMultiselectSelectStart(event) {
    if (multiselect && multiselectModifierActive) {
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

  $: setMultiselectKeyListeners(multiselect);

  /** @type {TreeWalker | null} */
  let treeWalker = null;

  /** @type {ReadonlyArray<Node> | null} */
  let cachedNodes = null;
  /** @type {Array<Node> | null} */
  let cachedFlattenedNodes = null;
  /** @type {Array<Node["id"]> | null} */
  let cachedNodeIds = null;

  /** @type {Node["id"] | null} */
  let anchorId = null;

  /** @type {Set<Node["id"]>} */
  let expandedIdsSet = new Set(expandedIds);
  /** @type {ReadonlyArray<Node["id"]>} */
  let lastExpandedIdsRef = expandedIds;
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
   * Re-derive the `expanded`/`selected` flags from the source-of-truth state
   * at dispatch time. The `node` object passed by the child components is
   * computed reactively, so its flags still reflect the pre-action state when a
   * handler mutates `selectedIds`/`expandedIds` and then dispatches synchronously.
   * @type {(node: Node) => Node & { expanded: boolean; selected: boolean }}
   */
  function withLiveState(node) {
    return {
      ...node,
      expanded: expandedIdsSet.has(node.id),
      selected: selectedIds.includes(node.id),
    };
  }

  /** @type {(node: Node, event?: Event) => void} */
  function clickNode(node, event) {
    activeId = node.id;

    const mode =
      multiselect && multiselectMode !== "node" ? multiselectMode : "node";

    if (multiselect && event) {
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
        selectedIds = Array.from(currentSet);
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
            selectedIds = sliceIds;
          } else {
            const ordered = [];
            const seen = new Set();
            for (const id of sliceIds) {
              const n = findForestNodeById(nodes, id);
              if (!n) continue;
              for (const eid of multiselectExpansionIds(n, mode)) {
                if (!seen.has(eid)) {
                  seen.add(eid);
                  ordered.push(eid);
                }
              }
            }
            selectedIds = ordered;
          }
        } else {
          selectedIds = multiselectExpansionIds(node, mode);
          anchorId = node.id;
        }
      } else {
        selectedIds = multiselectExpansionIds(node, mode);
        anchorId = node.id;
      }
    } else {
      selectedIds = [node.id];
    }

    dispatch("select", withLiveState(node));
  }

  /** @type {(node: Node) => void} */
  function selectNode(node) {
    if (multiselect) {
      const mode = multiselectMode === "node" ? "node" : multiselectMode;
      const expansion = multiselectExpansionIds(node, mode);
      const set = new Set(selectedIds);
      for (const id of expansion) set.add(id);
      selectedIds = Array.from(set);
    } else {
      selectedIds = [node.id];
    }
  }

  /** @type {(node: Node, expanded: boolean) => void} */
  function expandNode(node, expanded) {
    if (expanded) {
      if (autoCollapse) {
        const siblingIds = findSiblingIds(nodes, node.id);
        for (const siblingId of siblingIds) {
          expandedIdsSet.delete(siblingId);
        }
      }
      expandedIdsSet.add(node.id);
    } else {
      expandedIdsSet.delete(node.id);
    }
    expandedIds = Array.from(expandedIdsSet);
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
    expandedIdsSetStore,
    multiselectStore,
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
          multiselect &&
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
            multiselect &&
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
        for (const n of flattenedNodes) {
          if (n.disabled) continue;
          const el = ref?.querySelector(`[id="${CSS.escape(String(n.id))}"]`);
          if (!el) continue;
          if (
            el.classList.contains("bx--tree-node--hidden") ||
            isUnderCollapsedSubtree(el)
          ) {
            continue;
          }
          nodeIds.push(n.id);
        }
      }

      selectedIds = selectedIds.concat(nodeIds);
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
    };
  });

  $: if (nodes !== cachedNodes) {
    cachedNodes = nodes;
    cachedFlattenedNodes = traverse(nodes);
    cachedNodeIds = cachedFlattenedNodes.map((node) => node.id);
  }

  $: multiselectStore.set(multiselect);
  $: flattenedNodes = cachedFlattenedNodes ?? [];
  $: nodeIds = cachedNodeIds ?? [];

  let prevActiveIdForAutoCollapse = activeId;

  $: {
    if (expandedIds !== lastExpandedIdsRef) {
      expandedIdsSet = new Set(expandedIds);
      lastExpandedIdsRef = expandedIds;
    }

    // `autoCollapse` should also be triggered when activeId changes programmatically.
    if (autoCollapse && activeId !== prevActiveIdForAutoCollapse) {
      prevActiveIdForAutoCollapse = activeId;

      for (const child of nodes) {
        const path = findNodeById(child, activeId);
        if (path) {
          const ancestorIds = path.slice(0, -1).map((n) => n.id);

          // For each ancestor, collapse its siblings.
          for (const ancestorId of ancestorIds) {
            const siblingIds = findSiblingIds(nodes, ancestorId);
            for (const siblingId of siblingIds) {
              expandedIdsSet.delete(siblingId);
            }
            expandedIdsSet.add(ancestorId);
          }

          expandedIds = Array.from(expandedIdsSet);
          lastExpandedIdsRef = expandedIds;
          break;
        }
      }
    }

    if (activeId !== lastActiveIdPushed) {
      lastActiveIdPushed = activeId;
      activeNodeId.set(activeId);
    }
    if (!arrayIdsEqual(selectedIds, lastSelectedIdsPushed)) {
      lastSelectedIdsPushed = selectedIds;
      selectedIdsSetStore.set(new Set(selectedIds));
      selectedNodeIds.set(selectedIds);
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
  class:bx--tree--multiselect={multiselect}
  class:bx--tree--multiselect-modifier={multiselect && multiselectModifierActive}
  aria-label={hideLabel ? labelText : undefined}
  aria-labelledby={hideLabel ? undefined : labelId}
  aria-multiselectable={multiselect || undefined}
  on:mousedown|capture={syncModifierFromTreeMouseDown}
  on:selectstart|capture={handleMultiselectSelectStart}
  on:keydown
  on:keydown|stopPropagation={handleKeyDown}
>
  <TreeViewNodeList root {nodes} let:node>
    <slot {node}> {node.text} </slot>
  </TreeViewNodeList>
</ul>
