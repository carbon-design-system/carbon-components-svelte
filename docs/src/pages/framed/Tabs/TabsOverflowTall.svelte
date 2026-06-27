<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  const items = Array.from({ length: 12 }, (_, i) => ({
    label: `Tab label ${i + 1}`,
    secondaryLabel: `(${i + 1}/12)`,
  }));
</script>

<Tabs type="container">
  {#each items as item}
    <Tab label={item.label} secondaryLabel={item.secondaryLabel} />
  {/each}
  <svelte:fragment slot="content">
    {#each items as item}
      <TabContent>{item.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
