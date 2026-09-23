<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  let count = "";
  let label = "Engage";
  let disabled = true;
</script>

<Tabs
  type="container"
  dismissible
  on:dismiss={({ detail }) => console.log("dismiss", detail)}
>
  <Tab {label} secondaryLabel={count} />
  <Tab label="Analyze" {disabled} />
  <svelte:fragment slot="content">
    <TabContent>Engage content</TabContent>
    <TabContent>Analyze content</TabContent>
  </svelte:fragment>
</Tabs>

<button type="button" on:click={() => (count = "(3/4)")}>Load count</button>
<button type="button" on:click={() => (count = "")}>Clear count</button>
<button type="button" on:click={() => (label = "Renamed")}>Rename</button>
<button type="button" on:click={() => (disabled = false)}>Enable</button>
