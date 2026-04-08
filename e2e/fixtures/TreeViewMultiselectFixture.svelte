<script>
  import { TreeView } from "carbon-components-svelte";

  let activeId = 0;
  let selectedIds = [0];
  let expandedIds = [1];
  let multiselect = true;
  let multiselectMode = "node";

  const nodes = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      nodes: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          nodes: [
            { id: 3, text: "Apache Spark" },
            { id: 4, text: "Hadoop" },
          ],
        },
        { id: 5, text: "IBM Cloud SQL Query" },
        { id: 6, text: "IBM Db2 Warehouse on Cloud" },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      nodes: [{ id: 8, text: "IBM Blockchain Platform" }],
    },
    {
      id: 9,
      text: "Databases",
      nodes: [
        { id: 10, text: "IBM Cloud Databases for Elasticsearch" },
        { id: 11, text: "IBM Cloud Databases for Enterprise DB" },
        { id: 12, text: "IBM Cloud Databases for MongoDB" },
        { id: 13, text: "IBM Cloud Databases for PostgreSQL" },
      ],
    },
    {
      id: 14,
      text: "Integration",
      disabled: true,
      nodes: [{ id: 15, text: "IBM API Connect", disabled: true }],
    },
  ];
</script>

<div data-testid="mode" style="display:none">{multiselectMode}</div>
<div data-testid="selected-ids" style="display:none">
  {JSON.stringify(selectedIds)}
</div>

<div style="display: flex; gap: 8px; margin-bottom: 16px;">
  <button
    type="button"
    data-testid="set-node"
    onclick={() => multiselectMode = "node"}
  >
    node
  </button>
  <button
    type="button"
    data-testid="set-shallow"
    onclick={() => multiselectMode = "shallow"}
  >
    shallow
  </button>
  <button
    type="button"
    data-testid="set-deep"
    onclick={() => multiselectMode = "deep"}
  >
    deep
  </button>
</div>

<TreeView
  data-testid="tree-view"
  labelText="Cloud Products"
  {multiselect}
  {multiselectMode}
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
/>
