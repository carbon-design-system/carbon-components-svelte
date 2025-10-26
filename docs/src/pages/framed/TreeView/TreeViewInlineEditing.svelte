<script>
  import { RecursiveList, TreeView } from "carbon-components-svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  let nodes = [
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
        { id: 11, text: "IBM Cloud Databases for MongoDB" },
      ],
    },
  ];

  function updateNodeText(id, text) {
    const findAndUpdate = (items) => {
      for (const item of items) {
        if (item.id === id) {
          item.text = text;
          return true;
        }
        if (item.nodes && findAndUpdate(item.nodes)) {
          return true;
        }
      }
      return false;
    };
    findAndUpdate(nodes);
    nodes = nodes;
  }
</script>

<TreeView labelText="Cloud Products" {nodes} let:node>
  <div on:click|stopPropagation on:keydown|stopPropagation role="none">
    <span
      contenteditable={!node.disabled}
      on:input={(e) => updateNodeText(node.id, e.target.textContent)}
      style:display="flex"
      style:align-items="center"
      style:outline="none"
      style:gap="var(--cds-spacing-02)"
    >
      {node.text}
      <Edit aria-hidden="true" />
    </span>
  </div>
</TreeView>

<br />
<RecursiveList {nodes} />
