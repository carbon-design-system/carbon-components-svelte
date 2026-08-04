<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selectedId = "tab-1";
  let tabs = Array.from({ length: 12 }, (_, i) => ({
    id: `tab-${i + 1}`,
    label: `Tab label ${i + 1}`,
  }));

  function handleDismiss({ detail }) {
    tabs = tabs.filter((tab) => tab.id !== detail.id);
  }
</script>

<Tabs bind:selectedId dismissible on:dismiss={handleDismiss}>
  {#each tabs as tab (tab.id)}
    <Tab id={tab.id} label={tab.label} />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
