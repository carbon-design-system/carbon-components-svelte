<script>
  import {
    Box,
    Button,
    ContainedList,
    ListDetailItem,
    ListDetailLayout,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const services = [
    { id: "billing-api", region: "us-south", replicas: 3 },
    { id: "search-indexer", region: "eu-de", replicas: 6 },
    { id: "notifications", region: "us-south", replicas: 2 },
  ];

  const widths = { Narrow: "24rem", Medium: "44rem", Wide: "100%" };

  let width = "Narrow";
  let selectedId = "billing-api";

  $: service = services.find((item) => item.id === selectedId);
</script>

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal">
    {#each Object.keys(widths) as name}
      <Button
        size="small"
        kind={width === name ? "primary" : "tertiary"}
        on:click={() => (width = name)}
      >
        {name}
      </Button>
    {/each}
  </Stack>
  <Box width={widths[width]} height="18rem" border="subtle">
    <ListDetailLayout
      bind:selectedId
      syncUrl={false}
      listLabel="Services"
      detailLabel={service ? service.id : "Service"}
      backText="Back to services"
      emptyText="Select a service"
    >
      <ContainedList slot="list" labelText="Services" hideLabel>
        {#each services as item (item.id)}
          <ListDetailItem id={item.id}>{item.id}</ListDetailItem>
        {/each}
      </ContainedList>
      <Stack slot="detail" gap={4}>
        <Text tag="h2" type="heading-04">{service?.id}</Text>
        <Text color="secondary">
          {service?.replicas} replicas in {service?.region}
        </Text>
      </Stack>
    </ListDetailLayout>
  </Box>
</Stack>
