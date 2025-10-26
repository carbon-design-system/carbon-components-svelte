<script>
  import { Button, Tab, TabContent, Tabs } from "carbon-components-svelte";

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

<div style="margin: var(--cds-layout-01) 0">
  <Button on:click={() => (selected = 1)}>Set index to 1</Button>
</div>

<strong>Selected index:</strong>
{selected}
