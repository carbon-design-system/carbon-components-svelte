<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let removeOnDismiss = true;

  let selectedId = "one";
  let tabs = [
    { id: "one", label: "One" },
    { id: "two", label: "Two" },
    { id: "three", label: "Three" },
  ];
</script>

<Tabs
  bind:selectedId
  dismissible
  on:dismiss={({ detail }) => {
    console.log("dismiss", detail.id);
    if (removeOnDismiss) tabs = tabs.filter((tab) => tab.id !== detail.id);
  }}
>
  {#each tabs as tab (tab.id)}
    <Tab id={tab.id} label={tab.label} />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
