<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";
  import type { ComponentProps } from "svelte";

  export let selected = 0;
  export let icon: ComponentProps<Tab>["icon"] = undefined;
</script>

<TabsVertical
  {selected}
  on:change={({ detail }) => {
    console.log("change event", detail);
  }}
>
  <Tab label="Tab 1" {icon} />
  <Tab label="Tab 2" disabled />
  <Tab label="Tab 3" />
  <Tab label="Tab 4" />
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
    <TabContent>Content 4</TabContent>
  </svelte:fragment>
</TabsVertical>
