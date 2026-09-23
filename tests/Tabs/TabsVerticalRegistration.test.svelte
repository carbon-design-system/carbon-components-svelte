<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  let count = "";
</script>

<TabsVertical>
  <Tab label="Engage" secondaryLabel={count} />
  <Tab label="Analyze" />
  <svelte:fragment slot="content">
    <TabContent>Engage content</TabContent>
    <TabContent>Analyze content</TabContent>
  </svelte:fragment>
</TabsVertical>

<button type="button" on:click={() => (count = "(3/4)")}>Load count</button>
