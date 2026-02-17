<script>
  import { Stack, TreeView } from "carbon-components-svelte";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
  import Blockchain from "carbon-icons-svelte/lib/Blockchain.svelte";
  import DataBase from "carbon-icons-svelte/lib/DataBase.svelte";
  import SignalStrength from "carbon-icons-svelte/lib/SignalStrength.svelte";
  import WatsonMachineLearning from "carbon-icons-svelte/lib/WatsonMachineLearning.svelte";

  let activeId = 1;
  let selectedIds = [];
  let nodes = [
    { id: 0, text: "AI / Machine learning", icon: WatsonMachineLearning },
    {
      id: 1,
      text: "Analytics",
      icon: Analytics,
      nodes: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          icon: Analytics,
          nodes: [
            { id: 3, text: "Apache Spark", icon: Analytics },
            { id: 4, text: "Hadoop", icon: Analytics },
          ],
        },
        { id: 5, text: "IBM Cloud SQL Query", icon: Analytics },
        { id: 6, text: "IBM Db2 Warehouse on Cloud", icon: Analytics },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      icon: Blockchain,
      nodes: [{ id: 8, text: "IBM Blockchain Platform", icon: Blockchain }],
    },
    {
      id: 9,
      text: "Databases",
      icon: DataBase,
      nodes: [
        {
          id: 10,
          text: "IBM Cloud Databases for Elasticsearch",
          icon: DataBase,
        },
        {
          id: 11,
          text: "IBM Cloud Databases for Enterprise DB",
          icon: DataBase,
        },
        { id: 12, text: "IBM Cloud Databases for MongoDB", icon: DataBase },
        {
          id: 13,
          text: "IBM Cloud Databases for PostgreSQL",
          icon: DataBase,
        },
      ],
    },
    {
      id: 14,
      text: "Integration",
      icon: SignalStrength,
      disabled: true,
      nodes: [
        {
          id: 15,
          text: "IBM API Connect",
          icon: SignalStrength,
          disabled: true,
        },
      ],
    },
  ];
</script>

<Stack gap={5}>
  <TreeView
    labelText="Cloud Products"
    {nodes}
    bind:activeId
    bind:selectedIds
    on:select={({ detail }) => console.log("select", detail)}
    on:toggle={({ detail }) => console.log("toggle", detail)}
    on:focus={({ detail }) => console.log("focus", detail)}
  />
  <div>Active node id: {activeId}</div>
  <div>Selected ids: {JSON.stringify(selectedIds)}</div>
</Stack>
