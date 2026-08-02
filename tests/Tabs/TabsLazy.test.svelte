<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let selected = 0;
  export let lazy = false;
  export let unmountOnHide = false;
</script>

<Tabs {selected}>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" />
  <Tab label="Tab 3" />
  <svelte:fragment slot="content">
    <TabContent {lazy} {unmountOnHide}>Content 1</TabContent>
    <TabContent {lazy} {unmountOnHide}>Content 2</TabContent>
    <TabContent {lazy} {unmountOnHide}>Content 3</TabContent>
  </svelte:fragment>
</Tabs>
