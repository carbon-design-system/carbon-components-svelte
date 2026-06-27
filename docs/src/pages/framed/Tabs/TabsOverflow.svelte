<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  const items = Array.from({ length: 12 }, (_, i) => `Tab label ${i + 1}`);
</script>

<Tabs>
  {#each items as item}
    <Tab label={item} />
  {/each}
  <svelte:fragment slot="content">
    {#each items as item}
      <TabContent>{item} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
