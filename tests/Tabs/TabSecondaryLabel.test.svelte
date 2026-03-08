<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
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
