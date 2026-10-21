<script>
  import {
    Box,
    Search,
    Stack,
    Tag,
    Text,
    TextInput,
    ThemeZone,
    Tile,
  } from "carbon-components-svelte";

  const services = [
    { name: "api-gateway", status: "Live", type: "green" },
    { name: "billing-worker", status: "Deploying", type: "blue" },
    { name: "search-index", status: "Failed", type: "red" },
  ];
</script>

<Box display="flex" minHeight="20rem">
  <ThemeZone theme="g100" tag="aside">
    <Box width="16rem" padding={5}>
      <Stack gap={5}>
        <Text type="heading-compact-01">Services</Text>
        <Search size="sm" placeholder="Filter services" />
        <Stack gap={4}>
          {#each services as service (service.name)}
            <Stack
              orientation="horizontal"
              justify="space-between"
              align="center"
            >
              <Text type="body-compact-01">{service.name}</Text>
              <Tag size="sm" type={service.type}>{service.status}</Tag>
            </Stack>
          {/each}
        </Stack>
      </Stack>
    </Box>
  </ThemeZone>
  <Box grow alignSelf="start" padding={5}>
    <Stack gap={5}>
      <Text type="heading-compact-02">api-gateway</Text>
      <TextInput labelText="Service name" value="api-gateway" />
      <Tile>Last deploy finished 4 minutes ago.</Tile>
    </Stack>
  </Box>
</Box>
