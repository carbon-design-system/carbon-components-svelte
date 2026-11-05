<script>
  import {
    applyTreeMove,
    Button,
    sortableTree,
    TreeView,
  } from "carbon-components-svelte";
  import Draggable from "carbon-icons-svelte/lib/Draggable.svelte";

  let nodes = [
    { id: "ai", text: "AI / Machine learning" },
    {
      id: "analytics",
      text: "Analytics",
      nodes: [
        { id: "spark", text: "Apache Spark" },
        { id: "sql", text: "IBM Cloud SQL Query" },
        { id: "warehouse", text: "IBM Db2 Warehouse" },
      ],
    },
    {
      id: "databases",
      text: "Databases",
      nodes: [
        { id: "elastic", text: "Databases for Elasticsearch" },
        { id: "mongo", text: "Databases for MongoDB" },
      ],
    },
    { id: "blockchain", text: "Blockchain" },
  ];
  let expandedIds = ["analytics", "databases"];

  function handleMove(event) {
    nodes = applyTreeMove(nodes, event.detail);
  }
</script>

<div
  use:sortableTree={{
    label: "Cloud products",
    handleSelector: "[data-sortable-handle]",
  }}
  on:move={handleMove}
>
  <TreeView labelText="Cloud products" {nodes} bind:expandedIds let:node>
    <Button
      kind="ghost"
      size="small"
      icon={Draggable}
      iconDescription="Move {node.text}"
      tooltipPosition="right"
      data-sortable-handle
      on:click={(event) => event.stopPropagation()}
    />
    {node.text}
  </TreeView>
</div>
