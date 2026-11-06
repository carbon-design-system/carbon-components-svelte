<script>
  import {
    Box,
    ContainedList,
    ListDetailItem,
    ListDetailLayout,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const buckets = [
    { id: "audit-logs", size: "412 GB", objects: "1.2M" },
    { id: "build-artifacts", size: "86 GB", objects: "48K" },
    { id: "customer-exports", size: "1.9 TB", objects: "310K" },
  ];

  let selectedId = "";
  let loading = false;
  let bucket;

  // For demo purposes only: a real app would fetch the details.
  async function handleChange(event) {
    const id = event.detail.selectedId;
    if (!id) return;
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 900));
    bucket = buckets.find((item) => item.id === id);
    loading = false;
  }
</script>

<Box height="20rem" border="subtle">
  <ListDetailLayout
    bind:selectedId
    {loading}
    syncUrl={false}
    listLabel="Buckets"
    detailLabel={bucket ? bucket.id : "Bucket"}
    backText="Back to buckets"
    emptyText="Select a bucket to see its usage"
    on:change={handleChange}
  >
    <ContainedList slot="list" labelText="Buckets" hideLabel>
      {#each buckets as item (item.id)}
        <ListDetailItem id={item.id}>{item.id}</ListDetailItem>
      {/each}
    </ContainedList>
    <Stack slot="detail" gap={4}>
      <Text tag="h2" type="heading-04">{bucket?.id}</Text>
      <Text color="secondary">
        {bucket?.size} across {bucket?.objects} objects
      </Text>
    </Stack>
  </ListDetailLayout>
</Box>
