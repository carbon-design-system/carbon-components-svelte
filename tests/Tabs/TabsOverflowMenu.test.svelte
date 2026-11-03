<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let overflowMenu = true;
  export let overflowMenuText: string | undefined = undefined;
  export let selectedId = "a";
  export let tabs = [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Bravo" },
    { id: "c", label: "Charlie" },
    { id: "d", label: "Delta" },
    { id: "e", label: "Echo", disabled: true },
  ];
</script>

<Tabs
  bind:selectedId
  {overflowMenu}
  {...overflowMenuText === undefined ? {} : { overflowMenuText }}
>
  {#each tabs as tab (tab.id)}
    <Tab id={tab.id} label={tab.label} disabled={tab.disabled} />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
<p data-testid="selected">{selectedId}</p>
