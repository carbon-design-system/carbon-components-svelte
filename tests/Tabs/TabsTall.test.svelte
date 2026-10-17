<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let tall = true;
  export let type: "default" | "container" = "container";
  export let secondaryLabel = "(3)";
</script>

<Tabs {tall} {type}>
  <Tab label="Overview" />
  <Tab label="Details" {secondaryLabel} />
  <svelte:fragment slot="content">
    <TabContent>Overview content</TabContent>
    <TabContent>Details content</TabContent>
  </svelte:fragment>
</Tabs>
