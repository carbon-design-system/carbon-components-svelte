<script>
  import { Stack, TreeView } from "carbon-components-svelte";

  let activeId = "";
  let selectedIds = [];
  let nodes = [
    {
      id: 0,
      text: "IBM Cloud",
      href: "https://cloud.ibm.com",
      target: "_blank",
    },
    {
      id: 1,
      text: "Services",
      nodes: [
        {
          id: 2,
          text: "AI / Machine learning",
          href: "https://cloud.ibm.com/catalog#ai",
          target: "_blank",
        },
        {
          id: 3,
          text: "Analytics",
          href: "https://cloud.ibm.com/catalog#analytics",
          target: "_blank",
        },
        {
          id: 4,
          text: "Databases",
          href: "https://cloud.ibm.com/catalog#databases",
          target: "_blank",
        },
      ],
    },
    {
      id: 5,
      text: "Documentation",
      href: "https://cloud.ibm.com/docs",
      target: "_blank",
    },
    {
      id: 6,
      text: "Unavailable",
      href: "https://cloud.ibm.com/unavailable",
      disabled: true,
    },
  ];
</script>

<Stack gap={6}>
  <div>
    <TreeView
      labelText="Cloud Resources"
      {nodes}
      bind:activeId
      bind:selectedIds
      on:select={({ detail }) => console.log("select", detail)}
    />
  </div>
  <Stack gap={4}>
    <div>Active node id: {activeId}</div>
    <div>Selected ids: {JSON.stringify(selectedIds)}</div>
  </Stack>
</Stack>
