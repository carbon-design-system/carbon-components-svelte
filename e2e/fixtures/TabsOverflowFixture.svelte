<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  const items = Array.from({ length: 10 }, (_, i) => `Tab label ${i + 1}`);
</script>

<!-- Constrain the width so the list overflows regardless of the viewport. -->
<div style="inline-size: 320px;" data-testid="tabs-overflow">
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
</div>
