<script>
  import {
    Button,
    ButtonSet,
    ContentSwitcher,
    Stack,
    Switch,
    TreeView,
  } from "carbon-components-svelte";
  import { onMount, tick } from "svelte";

  let treeview = null;
  let performanceInfo = {
    generate: 0,
    expandAll: 0,
    collapseAll: 0,
    showNode: 0,
  };

  function generateLargeTree() {
    const nodes = [];
    let idCounter = 0;

    for (let i = 0; i < 10; i++) {
      const categoryNodes = [];

      for (let j = 0; j < 10; j++) {
        const subcategoryNodes = [];

        for (let k = 0; k < 10; k++) {
          subcategoryNodes.push({
            id: idCounter++,
            text: `Item ${i}-${j}-${k}`,
          });
        }

        categoryNodes.push({
          id: idCounter++,
          text: `Subcategory ${i}-${j}`,
          nodes: subcategoryNodes,
        });
      }

      nodes.push({
        id: idCounter++,
        text: `Category ${i}`,
        nodes: categoryNodes,
      });
    }

    return { nodes, count: idCounter };
  }

  function generateDeepTree() {
    let idCounter = 0;
    let lastId = 0;

    function createNestedNode(depth, maxDepth) {
      const node = {
        id: idCounter++,
        text: `Level ${depth}`,
      };
      lastId = node.id;

      if (depth < maxDepth) {
        node.nodes = [createNestedNode(depth + 1, maxDepth)];
      }

      return node;
    }

    const rootNode = createNestedNode(0, 100);
    return { nodes: [rootNode], count: idCounter, lastId };
  }

  let genStart = performance.now();
  let initialTree = generateLargeTree();
  let nodes = initialTree.nodes;
  let nodeCount = initialTree.count;
  let treeType = "large";
  let lastDeepNodeId = null;
  let selectedIndex = 0;

  $: hasTiming =
    performanceInfo.generate > 0 ||
    performanceInfo.expandAll > 0 ||
    performanceInfo.collapseAll > 0 ||
    performanceInfo.showNode > 0;

  onMount(async () => {
    await tick();
    const end = performance.now();
    performanceInfo.generate = end - genStart;
    performanceInfo = performanceInfo;
  });

  async function handleTreeSwitch(event) {
    const index = event.detail;
    selectedIndex = index;

    performanceInfo = {
      generate: 0,
      expandAll: 0,
      collapseAll: 0,
      showNode: 0,
    };

    const start = performance.now();
    if (index === 0) {
      const result = generateLargeTree();
      nodes = result.nodes;
      nodeCount = result.count;
      treeType = "large";
      lastDeepNodeId = null;
    } else {
      const result = generateDeepTree();
      nodes = result.nodes;
      nodeCount = result.count;
      lastDeepNodeId = result.lastId;
      treeType = "deep";
    }

    await tick();
    const end = performance.now();
    performanceInfo.generate = end - start;
    performanceInfo = performanceInfo;
  }

  function handleExpandAll() {
    const start = performance.now();
    treeview?.expandAll();
    const end = performance.now();
    performanceInfo.expandAll = end - start;
    performanceInfo = performanceInfo;
  }

  function handleCollapseAll() {
    const start = performance.now();
    treeview?.collapseAll();
    const end = performance.now();
    performanceInfo.collapseAll = end - start;
    performanceInfo = performanceInfo;
  }

  function handleShowNode() {
    const start = performance.now();
    const targetId =
      treeType === "large"
        ? 999
        : lastDeepNodeId === null
          ? 100
          : lastDeepNodeId;
    if (treeview) {
      treeview.showNode(targetId);
    }
    const end = performance.now();
    performanceInfo.showNode = end - start;
    performanceInfo = performanceInfo;
  }
</script>

<Stack gap={6}>
  <ContentSwitcher {selectedIndex} on:change={handleTreeSwitch}>
    <Switch text="Large Tree (1000+ nodes)" />
    <Switch text="Deep Tree (100 levels)" />
  </ContentSwitcher>

  <ButtonSet>
    <Button on:click={handleExpandAll}>Expand All</Button>
    <Button on:click={handleCollapseAll}>Collapse All</Button>
    <Button on:click={handleShowNode}>Show Deep Node</Button>
  </ButtonSet>

  {#if hasTiming}
    <Stack gap={2}>
      {#if performanceInfo.generate > 0}
        <div>
          Tree Generation: {performanceInfo.generate.toFixed(4)}ms ({nodeCount.toLocaleString()}
          nodes)
        </div>
      {/if}
      {#if performanceInfo.expandAll > 0}
        <div>Expand All: {performanceInfo.expandAll.toFixed(4)}ms</div>
      {/if}
      {#if performanceInfo.collapseAll > 0}
        <div>Collapse All: {performanceInfo.collapseAll.toFixed(4)}ms</div>
      {/if}
      {#if performanceInfo.showNode > 0}
        <div>Show Node: {performanceInfo.showNode.toFixed(4)}ms</div>
      {/if}
    </Stack>
  {/if}
  <div>
    <TreeView
      bind:this={treeview}
      labelText={treeType === "large"
        ? "Large Tree (1000+ nodes)"
        : "Deep Tree (100 levels)"}
      {nodes}
    />
  </div>
</Stack>
