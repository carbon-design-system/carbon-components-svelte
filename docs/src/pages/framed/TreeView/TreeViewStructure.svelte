<script>
  import {
    Breadcrumb,
    BreadcrumbItem,
    Stack,
    TreeView,
  } from "carbon-components-svelte";

  let treeview = null;
  let activeId = "spark";
  let nodes = [
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
        { id: "db2", text: "IBM Db2 Warehouse on Cloud" },
      ],
    },
    {
      id: "blockchain",
      text: "Blockchain",
      nodes: [{ id: "platform", text: "IBM Blockchain Platform" }],
    },
  ];

  $: activeNode = treeview?.getNode(activeId) ?? null;
  $: ancestors = treeview?.getAncestors(activeId) ?? [];
  $: siblings = treeview?.getSiblings(activeId) ?? [];
  $: children = treeview?.getChildren(activeId) ?? [];

  function listText(list) {
    return list.map((node) => node.text).join(", ") || "(none)";
  }
</script>

<Stack gap={6}>
  <Breadcrumb noTrailingSlash>
    {#each ancestors as ancestor (ancestor.id)}
      <BreadcrumbItem
        href="#"
        on:click={(event) => {
          event.preventDefault();
          treeview?.showNode(ancestor.id);
        }}
      >
        {ancestor.text}
      </BreadcrumbItem>
    {/each}
    {#if activeNode}
      <BreadcrumbItem isCurrentPage>{activeNode.text}</BreadcrumbItem>
    {/if}
  </Breadcrumb>
  <div>
    <TreeView
      bind:this={treeview}
      labelText="Cloud Products"
      {nodes}
      bind:activeId
      expandedIds={["analytics", "engine"]}
    />
  </div>
  <Stack gap={4}>
    <div>Siblings: {listText(siblings)}</div>
    <div>Children: {listText(children)}</div>
  </Stack>
</Stack>
