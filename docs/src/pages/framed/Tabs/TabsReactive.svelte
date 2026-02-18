<script>
  import { Button, Stack, Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selected = 0;
</script>

<Tabs bind:selected>
  <Tab label="Tab label 1" />
  <Tab label="Tab label 2" />
  <Tab label="Tab label 3" />
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </svelte:fragment>
</Tabs>

<Stack gap={2}>
  <div>
    <Button on:click={() => (selected = 1)}>Set index to 1</Button>
  </div>
  <div>
    <strong>Selected index:</strong>
    {selected}
  </div>
</Stack>
