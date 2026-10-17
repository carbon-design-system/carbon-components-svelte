<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  export let type: "default" | "container" | "vertical" = "container";
</script>

{#if type === "vertical"}
  <TabsVertical>
    <Tab label="Overview" />
    <Tab label="Details" secondaryLabel="(3)" />
  </TabsVertical>
{:else}
  <Tabs {type}>
    <Tab label="Overview" />
    <Tab label="Details" secondaryLabel="(3)" />
  </Tabs>
{/if}
