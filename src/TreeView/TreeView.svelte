<script context="module">
  /**
   * Depth-first search to find a node by id; returns an array
   * of nodes from the initial node to the matching leaf.
   * @template {{ id: string | number; nodes?: TNode[] }} TNode
   * @param {TNode | null} node
   * @param {string | number} id
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

  /**
   * Creates a TreeWalker instance for keyboard navigation.
   * @param {HTMLElement} root - The root element to traverse
   * @returns {TreeWalker} A TreeWalker configured to navigate tree nodes
   */
  function createTreeWalkerInstance(root) {
    return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (node.classList.contains("bx--tree-node--disabled"))
          return NodeFilter.FILTER_REJECT;
        if (node.matches("li.bx--tree-node")) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      },
    });
  }

  /**
   * Recursively flattens a tree of nodes into a single array
   * @template {object} Node
   * @param {ReadonlyArray<Node & { nodes?: Node[] }>} nodes
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
   * Finds sibling node IDs for a given node ID within a tree structure.
   * @template {{ id: string | number; nodes?: TNode[] }} TNode
   * @param {ReadonlyArray<TNode>} nodes - The tree nodes to search
   * @param {string | number} id - The ID of the node to find siblings for
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
</script>

<script>
  /**
   * @generics {Node extends TreeNode<any> = TreeNode<any>} Node
   * @template {TreeNode<any>} Node
   * @typedef {object} TreeNode<Id=(string|number)>
   * @property {Id} id
   * @property {any} text
   * @property {any} [icon]
   * @property {boolean} [disabled] - Whether the node is disabled
   * @property {TreeNode<Id>[]} [nodes]
   * @typedef {object} ShowNodeOptions
   * @property {boolean} [expand] - Whether to expand the node and its ancestors (default: true)
   * @property {boolean} [select] - Whether to select the node (default: true)
   * @property {boolean} [focus] - Whether to focus the node (default: true)
   * @slot {{ node: Node & { expanded: boolean; leaf: boolean; selected: boolean; } }}
   * @event select
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
   * @event toggle
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
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
   */
  export let activeId = "";

  /**
   * Set the node ids to be selected.
   * @type {ReadonlyArray<Node["id"]>}
   */
  export let selectedIds = [];

  /**
   * Set the node ids to be expanded.
   * @type {ReadonlyArray<Node["id"]>}
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
  export function expandNodes(filterNode = (node) => false) {
    const nodesToExpand = flattenedNodes
      .filter(
        (node) =>
          filterNode(node) ||
          node.nodes?.some((child) => filterNode(child) && child.nodes)
      )
      .map((node) => node.id);
    nodesToExpand.forEach((id) => expandedIdsSet.add(id));
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
  export function collapseNodes(filterNode = (node) => true) {
    flattenedNodes.forEach((node) => {
      if (expandedIdsSet.has(node.id) && filterNode(node)) {
        expandedIdsSet.delete(node.id);
      }
    });
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
          selectedIds = [lastId];
        }

        if (focus) {
          tick().then(() => {
            ref?.querySelector(`[id="${lastId}"]`)?.focus();
          });
        }

        break;
      }
    }
  }

  import { createEventDispatcher, setContext, onMount, tick } from "svelte";
  import { writable } from "svelte/store";
  import TreeViewNodeList from "./TreeViewNodeList.svelte";

  const dispatch = createEventDispatcher();
  const labelId = `label-${Math.random().toString(36)}`;

  /** @type {import("svelte/store").Writable<Node["id"]>} */
  const activeNodeId = writable(activeId);
  /** @type {import("svelte/store").Writable<ReadonlyArray<Node["id"]>>} */
  const selectedNodeIds = writable(selectedIds);
  /** @type {import("svelte/store").Writable<ReadonlyArray<Node["id"]>>} */
  const expandedNodeIds = writable(expandedIds);

  /** @type {HTMLElement | null} */
  let ref = null;
  /** @type {TreeWalker | null} */
  let treeWalker = null;

  /** @type {ReadonlyArray<Node> | null} */
  let cachedNodes = null;
  /** @type {Array<Node> | null} */
  let cachedFlattenedNodes = null;
  /** @type {Array<Node["id"]> | null} */
  let cachedNodeIds = null;

  /** @type {Set<Node["id"]>} */
  let expandedIdsSet = new Set(expandedIds);
  /** @type {ReadonlyArray<Node["id"]>} */
  let lastExpandedIdsRef = expandedIds;

  /** @type {(node: Node) => void} */
  const clickNode = (node) => {
    activeId = node.id;
    selectedIds = [node.id];
    dispatch("select", node);
  };

  /** @type {(node: Node) => void} */
  const selectNode = (node) => {
    selectedIds = [node.id];
  };

  /** @type {(node: Node, expanded: boolean) => void} */
  const expandNode = (node, expanded) => {
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
  };

  /** @type {(node: Node) => void} */
  const focusNode = (node) => dispatch("focus", node);

  /** @type {(node: Node) => void} */
  const toggleNode = (node) => dispatch("toggle", node);

  setContext("TreeView", {
    activeNodeId,
    selectedNodeIds,
    expandedNodeIds,
    clickNode,
    selectNode,
    expandNode,
    focusNode,
    toggleNode,
  });

  function handleKeyDown(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();

    treeWalker.currentNode = e.target;

    let node = null;

    if (e.key === "ArrowUp") node = treeWalker.previousNode();
    if (e.key === "ArrowDown") node = treeWalker.nextNode();
    if (node && node !== e.target) {
      node.tabIndex = "0";
      node.focus();
    }
  }

  onMount(() => {
    const firstFocusableNode = ref.querySelector(
      "li.bx--tree-node:not(.bx--tree-node--disabled)"
    );

    if (firstFocusableNode != null) {
      firstFocusableNode.tabIndex = "0";
    }

    if (ref && !treeWalker) {
      treeWalker = createTreeWalkerInstance(ref);
    }
  });

  $: if (nodes !== cachedNodes) {
    cachedNodes = nodes;
    cachedFlattenedNodes = traverse(nodes);
    cachedNodeIds = cachedFlattenedNodes.map((node) => node.id);
  }

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

    activeNodeId.set(activeId);
    selectedNodeIds.set(selectedIds);
    expandedNodeIds.set(expandedIds);
  }

  $: if (ref && (nodes !== cachedNodes || !treeWalker)) {
    treeWalker = createTreeWalkerInstance(ref);
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
  aria-label={hideLabel ? labelText : undefined}
  aria-labelledby={!hideLabel ? labelId : undefined}
  aria-multiselectable={selectedIds.length > 1 || undefined}
  on:keydown
  on:keydown|stopPropagation={handleKeyDown}
>
  <TreeViewNodeList root {nodes} let:node>
    <slot {node}>
      {node.text}
    </slot>
  </TreeViewNodeList>
</ul>
