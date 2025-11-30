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
</script>

<script>
  /**
   * @generics {Node extends TreeNode = TreeNode} Node
   * @template {TreeNode} Node
   * @typedef {string | number} TreeNodeId
   * @typedef {object} TreeNode
   * @property {TreeNodeId} id
   * @property {any} text
   * @property {any} [icon]
   * @property {boolean} [disabled] - Whether the node is disabled
   * @property {TreeNode[]} [nodes]
   * @typedef {object} ShowNodeOptions
   * @property {boolean} [expand] - Whether to expand the node and its ancestors (default: true)
   * @property {boolean} [select] - Whether to select the node (default: true)
   * @property {boolean} [focus] - Whether to focus the node (default: true)
   * @slot {{ node: { id: TreeNodeId; text: string; expanded: boolean, leaf: boolean; disabled: boolean; selected: boolean; } }}
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
   * @type {TreeNodeId}
   */
  export let activeId = "";

  /**
   * Set the node ids to be selected.
   * @type {ReadonlyArray<TreeNodeId>}
   */
  export let selectedIds = [];

  /**
   * Set the node ids to be expanded.
   * @type {ReadonlyArray<TreeNodeId>}
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
   * Programmatically expand all nodes
   * @type {() => void}
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.expandAll()}>Expand All</button>
   * ```
   */
  export function expandAll() {
    expandedIds = [...nodeIds];
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
    expandedIds = [];
  }

  /**
   * Programmatically expand a subset of nodes.
   * Expands all nodes if no argument is provided
   * @type {(filterNode?: (node: Node) => boolean) => void}
   * @param {function(node: Node): boolean} [filterNode] - Filter function that returns `true` for nodes to expand. If not provided, expands all nodes.
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.expandNodes((node) => node.id.startsWith('folder-'))}>
   *   Expand Folders
   * </button>
   * ```
   */
  export function expandNodes(filterNode = (node) => false) {
    expandedIds = flattenedNodes
      .filter(
        (node) =>
          filterNode(node) ||
          node.nodes?.some((child) => filterNode(child) && child.nodes),
      )
      .map((node) => node.id);
  }

  /**
   * Programmatically collapse a subset of nodes.
   * Collapses all nodes if no argument is provided
   * @type {(filterNode?: (node: Node) => boolean) => void}
   * @param {function(node: Node): boolean} [filterNode] - Filter function that returns `true` for nodes to collapse. If not provided, collapses all nodes.
   * @example
   * ```svelte
   * <TreeView bind:this={treeView} {nodes} />
   * <button on:click={() => treeView.collapseNodes((node) => node.id.startsWith('folder-'))}>
   *   Collapse Folders
   * </button>
   * ```
   */
  export function collapseNodes(filterNode = (node) => true) {
    expandedIds = flattenedNodes
      .filter((node) => expandedIds.includes(node.id) && !filterNode(node))
      .map((node) => node.id);
  }

  /**
   * Programmatically show a node by `id`.
   * By default, the matching node will be expanded, selected, and focused.
   * Use the options parameter to customize this behavior.
   * @type {(id: TreeNodeId, options?: ShowNodeOptions) => void}
   * @param {TreeNodeId} id - The unique identifier of the node to show
   * @param {ShowNodeOptions} [options] - Configuration options for showing the node
   * @param {boolean} [options.expand=true] - Whether to expand the node and its ancestors
   * @param {boolean} [options.select=true] - Whether to select the node
   * @param {boolean} [options.focus=true] - Whether to focus the node
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
      const nodes = findNodeById(child, id);

      if (nodes) {
        const ids = nodes.map((node) => node.id);
        const nodeIds = new Set(ids);

        if (expand) {
          expandNodes((node) => nodeIds.has(node.id));
        }

        const lastId = ids[ids.length - 1];

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
  /**
   * @type {import("svelte/store").Writable<TreeNodeId>}
   */
  const activeNodeId = writable(activeId);
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<TreeNodeId>>}
   */
  const selectedNodeIds = writable(selectedIds);
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<TreeNodeId>>}
   */
  const expandedNodeIds = writable(expandedIds);

  let ref = null;
  let treeWalker = null;

  /**
   * @type {(node: TreeNode) => void}
   */
  const clickNode = (node) => {
    activeId = node.id;
    selectedIds = [node.id];
    dispatch("select", node);
  };

  /**
   * @type {(node: TreeNode) => void}
   */
  const selectNode = (node) => {
    selectedIds = [node.id];
  };

  /**
   * @type {(node: TreeNode, expanded: boolean) => void}
   */
  const expandNode = (node, expanded) => {
    if (expanded) {
      expandedIds = [...expandedIds, node.id];
    } else {
      expandedIds = expandedIds.filter((_id) => _id !== node.id);
    }
  };

  /**
   * @type {(node: TreeNode) => void}
   */
  const focusNode = (node) => dispatch("focus", node);

  /**
   * @type {(node: TreeNode) => void}
   */
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
      "li.bx--tree-node:not(.bx--tree-node--disabled)",
    );

    if (firstFocusableNode != null) {
      firstFocusableNode.tabIndex = "0";
    }
  });

  /**
   * Recursively flattens a tree of nodes into a single array
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

  $: flattenedNodes = traverse(nodes);
  $: nodeIds = flattenedNodes.map((node) => node.id);
  $: activeNodeId.set(activeId);
  $: selectedNodeIds.set(selectedIds);
  $: expandedNodeIds.set(expandedIds);
  $: if (ref) {
    treeWalker = document.createTreeWalker(ref, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (node.classList.contains("bx--tree-node--disabled"))
          return NodeFilter.FILTER_REJECT;
        if (node.matches("li.bx--tree-node")) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      },
    });
  }
</script>

{#if !hideLabel}
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label id={labelId} class:bx--label={true}>
    <slot name="labelText">{labelText}</slot>
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
