<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
</script>

<Tabs type="container">
  <Tab label="Engage" secondaryLabel="(21/25)" />
  <Tab label="Analyze">
    <svelte:fragment slot="secondaryChildren">(12/16)</svelte:fragment>
  </Tab>
  <Tab label="Plain" />
  <svelte:fragment slot="content">
    <TabContent>Engage content</TabContent>
    <TabContent>Analyze content</TabContent>
    <TabContent>Plain content</TabContent>
  </svelte:fragment>
</Tabs>
