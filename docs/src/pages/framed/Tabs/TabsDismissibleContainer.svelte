<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selectedId = "dashboard";
  let tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "monitoring", label: "Monitoring" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings", disabled: true },
  ];

  function handleDismiss({ detail }) {
    tabs = tabs.filter((tab) => tab.id !== detail.id);
  }
</script>

<Tabs type="container" bind:selectedId dismissible on:dismiss={handleDismiss}>
  {#each tabs as tab (tab.id)}
    <Tab id={tab.id} label={tab.label} disabled={tab.disabled} />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
