<script>
  import { TreeView } from "carbon-components-svelte";

  let activeId = 0;
  let selectedIds = [0, 7, 9];
  let children = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      children: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          children: [
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
      children: [{ id: 8, text: "IBM Blockchain Platform" }],
    },
    {
      id: 9,
      text: "Databases",
      children: [
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
      children: [{ id: 15, text: "IBM API Connect", disabled: true }],
    },
  ];
</script>

<TreeView
  labelText="Cloud Products"
  activeId="{activeId}"
  selectedIds="{selectedIds}"
  children="{children}"
  let:node
>
  <span
    style:color="{node.selected ? "var(--cds-interactive-04)" : "inherit"}"
    style:text-decoration="{node.disabled ? "inherit" : "underline"}"
  >
    {node.text} (id: {node.id})
  </span>
</TreeView>
