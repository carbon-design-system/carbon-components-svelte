<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  const labels = ["Tab 1", "Tab 2", "Tab 3"];
</script>

{#each ["line", "container"] as type}
  <Tabs {type} dismissible data-testid="tabs-{type}">
    {#each labels as label}
      <Tab {label} />
    {/each}
    <svelte:fragment slot="content">
      {#each labels as label}
        <TabContent>{label} content</TabContent>
      {/each}
    </svelte:fragment>
  </Tabs>
{/each}
