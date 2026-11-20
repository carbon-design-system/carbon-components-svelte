<script>
  import {
    Box,
    ContainedList,
    ListDetailItem,
    ListDetailLayout,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const clusters = [
    {
      id: "prod-us-south",
      name: "prod-us-south",
      nodes: 12,
      version: "1.29.4",
    },
    { id: "prod-eu-de", name: "prod-eu-de", nodes: 9, version: "1.29.4" },
    { id: "staging", name: "staging", nodes: 3, version: "1.30.1" },
    { id: "ml-batch", name: "ml-batch", nodes: 24, version: "1.28.9" },
  ];

  let selectedId = "prod-eu-de";
  let listSize = 35;

  $: cluster = clusters.find((item) => item.id === selectedId);
</script>

<Stack gap={5}>
  <Box height="20rem" border="subtle">
    <ListDetailLayout
      bind:selectedId
      bind:listSize
      resizable
      syncUrl={false}
      listLabel="Clusters"
      detailLabel={cluster ? cluster.name : "Cluster"}
      backText="Back to clusters"
      emptyText="Select a cluster"
      separatorLabel="Resize cluster list"
    >
      <ContainedList slot="list" labelText="Clusters" hideLabel>
        {#each clusters as item (item.id)}
          <ListDetailItem id={item.id}>{item.name}</ListDetailItem>
        {/each}
      </ContainedList>
      <Stack slot="detail" gap={4}>
        <Text tag="h2" type="heading-04">{cluster?.name}</Text>
        <Text color="secondary">
          {cluster?.nodes} nodes · Kubernetes {cluster?.version}
        </Text>
      </Stack>
    </ListDetailLayout>
  </Box>
  <Text>List width: {Math.round(listSize)}%</Text>
</Stack>
