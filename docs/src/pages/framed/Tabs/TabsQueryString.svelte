<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
  ];

  let selectedId = tabs[0].id;
  let restored = false;

  onMount(() => {
    const id = new URLSearchParams(window.location.search).get("tab");
    if (tabs.some((tab) => tab.id === id)) selectedId = id;
    restored = true;
  });

  function writeQuery(id) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    // `useRoutify: false` opts out of this docs site's router, which
    // intercepts history calls. Drop it in an app without Routify.
    history.replaceState({ ...history.state, useRoutify: false }, "", url.href);
  }

  $: if (restored) writeQuery(selectedId);
</script>

<Tabs bind:selectedId>
  {#each tabs as tab (tab.id)}
    <Tab id={tab.id} label={tab.label} />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
