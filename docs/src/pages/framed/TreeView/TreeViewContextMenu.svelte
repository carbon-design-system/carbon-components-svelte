<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
    Stack,
    TreeView,
  } from "carbon-components-svelte";

  let treeview = null;
  let target = null;
  let expandedIds = ["analytics"];
  let contextNode = null;
  let lastAction = "";

  const nodes = [
    { id: "ai", text: "AI / Machine learning" },
    {
      id: "analytics",
      text: "Analytics",
      nodes: [
        {
          id: "engine",
          text: "IBM Analytics Engine",
          nodes: [
            { id: "spark", text: "Apache Spark" },
            { id: "hadoop", text: "Hadoop" },
          ],
        },
        { id: "sql-query", text: "IBM Cloud SQL Query" },
      ],
    },
    {
      id: "blockchain",
      text: "Blockchain",
      nodes: [{ id: "platform", text: "IBM Blockchain Platform" }],
    },
  ];

  $: parent = contextNode ? treeview?.getParent(contextNode.id) : null;
  $: isBranch = contextNode?.nodes !== undefined;
  $: isExpanded = contextNode ? expandedIds.includes(contextNode.id) : false;

  // `detail` is the element that was right-clicked. Rows carry the node id
  // as their `id`, so look up the node for the nearest row.
  function handleOpen(event) {
    const row = event.detail?.closest?.('[role="treeitem"]');
    contextNode = row ? treeview?.getNode(row.id) : null;
    if (contextNode) {
      treeview?.showNode(contextNode.id, { expand: false, focus: false });
    }
  }

  function toggle() {
    const { id, text } = contextNode;
    if (isExpanded) {
      expandedIds = expandedIds.filter((expandedId) => expandedId !== id);
      lastAction = `Collapsed ${text}`;
    } else {
      expandedIds = [...expandedIds, id];
      lastAction = `Expanded ${text}`;
    }
  }

  function collapseSiblings() {
    const siblingIds = new Set(
      treeview?.getSiblings(contextNode.id).map((node) => node.id),
    );
    expandedIds = expandedIds.filter((id) => !siblingIds.has(id));
    lastAction = `Collapsed the siblings of ${contextNode.text}`;
  }
</script>

<ContextMenu target={[target]} on:open={handleOpen}>
  <ContextMenuOption
    labelText={isExpanded ? "Collapse" : "Expand"}
    disabled={!isBranch}
    on:click={toggle}
  />
  <ContextMenuOption
    labelText="Collapse siblings"
    disabled={!contextNode}
    on:click={collapseSiblings}
  />
  <ContextMenuDivider />
  <ContextMenuOption
    labelText="Go to parent"
    disabled={!parent}
    on:click={() => {
      treeview?.showNode(parent.id);
      lastAction = `Moved to ${parent.text}`;
    }}
  />
</ContextMenu>

<Stack gap={6}>
  <div bind:this={target}>
    <TreeView
      bind:this={treeview}
      labelText="Cloud Products (right-click a node)"
      {nodes}
      bind:expandedIds
    />
  </div>
  <div aria-live="polite">{lastAction}</div>
</Stack>
