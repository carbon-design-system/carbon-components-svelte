<script>
  import { queryParam, Tab, TabContent, Tabs } from "carbon-components-svelte";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
  ];

  const selectedTab = queryParam("tab", {
    defaultValue: tabs[0].id,
    parse: (id) => (tabs.some((tab) => tab.id === id) ? id : undefined),
    // docs-only:start
    // Opt out of this docs site's router, which intercepts history calls.
    replace: (href) =>
      history.replaceState({ ...history.state, useRoutify: false }, "", href),
    // docs-only:end
  });
</script>

<Tabs bind:selectedId={$selectedTab}>
  {#each tabs as tab (tab.id)}
    <Tab id={tab.id} label={tab.label} />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
