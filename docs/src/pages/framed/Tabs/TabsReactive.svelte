<script>
  import {
    Button,
    Stack,
    Tab,
    TabContent,
    Tabs,
  } from "carbon-components-svelte";

  let selected = 0;
</script>

<Stack gap={6}>
  <Tabs bind:selected>
    <Tab label="Dashboard" />
    <Tab label="Monitoring" />
    <Tab label="Activity" />
    <svelte:fragment slot="content">
      <TabContent>Dashboard content with analytics and overview.</TabContent>
      <TabContent>Monitoring content for uptime and alerts.</TabContent>
      <TabContent>Activity content for recent user actions.</TabContent>
    </svelte:fragment>
  </Tabs>
  <Stack gap={4} orientation="horizontal" align="center">
    <div>
      <Button kind="tertiary" size="small" on:click={() => (selected = 1)}>
        Set index to 1
      </Button>
    </div>
    <div>
      <strong>Selected index:</strong>
      {selected}
    </div>
  </Stack>
</Stack>
