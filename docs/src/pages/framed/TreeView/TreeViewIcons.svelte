<script>
  import { TreeView } from "carbon-components-svelte";
  import WatsonMachineLearning16 from "carbon-icons-svelte/lib/WatsonMachineLearning16";
  import Analytics16 from "carbon-icons-svelte/lib/Analytics16";
  import Blockchain16 from "carbon-icons-svelte/lib/Blockchain16";
  import DataBase16 from "carbon-icons-svelte/lib/DataBase16";
  import SignalStrength16 from "carbon-icons-svelte/lib/SignalStrength16";

  let activeId = 1;
  let selectedIds = [];
  let children = [
    { id: 0, text: "AI / Machine learning", icon: WatsonMachineLearning16 },
    {
      id: 1,
      text: "Analytics",
      icon: Analytics16,
      expanded: true,
      children: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          icon: Analytics16,
          expanded: true,
          children: [
            { id: 3, text: "Apache Spark", icon: Analytics16 },
            { id: 4, text: "Hadoop", icon: Analytics16 },
          ],
        },
        { id: 5, text: "IBM Cloud SQL Query", icon: Analytics16 },
        { id: 6, text: "IBM Db2 Warehouse on Cloud", icon: Analytics16 },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      icon: Blockchain16,
      children: [
        { id: 8, text: "IBM Blockchain Platform", icon: Blockchain16 },
      ],
    },
    {
      id: 9,
      text: "Databases",
      icon: DataBase16,
      children: [
        {
          id: 10,
          text: "IBM Cloud Databases for Elasticsearch",
          icon: DataBase16,
        },
        {
          id: 11,
          text: "IBM Cloud Databases for Enterprise DB",
          icon: DataBase16,
        },
        { id: 12, text: "IBM Cloud Databases for MongoDB", icon: DataBase16 },
        {
          id: 13,
          text: "IBM Cloud Databases for PostgreSQL",
          icon: DataBase16,
        },
      ],
    },
    {
      id: 14,
      text: "Integration",
      icon: SignalStrength16,
      disabled: true,
      children: [
        {
          id: 15,
          text: "IBM API Connect",
          icon: SignalStrength16,
          disabled: true,
        },
      ],
    },
  ];
</script>

<TreeView
  labelText="Cloud Products"
  children="{children}"
  bind:activeId
  bind:selectedIds
  on:select="{({ detail }) => console.log('select', detail)}"
  on:toggle="{({ detail }) => console.log('toggle', detail)}"
  on:focus="{({ detail }) => console.log('focus', detail)}"
/>

<div>Active node id: {activeId}</div>
<div>Selected ids: {JSON.stringify(selectedIds)}</div>

<style>
  div {
    margin-top: var(--cds-spacing-05);
  }
</style>
