<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";
  import type { ComponentProps } from "svelte";

  export let selected = 0;
  export let activation: ComponentProps<TabsVertical>["activation"] =
    "automatic";
  export let size: ComponentProps<TabsVertical>["size"] = undefined;
  export let orientation: ComponentProps<TabsVertical>["orientation"] =
    undefined;
  export let onChange: (index: number) => void = () => {};
</script>

<TabsVertical
  {selected}
  {activation}
  {size}
  {orientation}
  on:change={({ detail }) => onChange(detail)}
>
  <Tab label="Tab 1" />
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
