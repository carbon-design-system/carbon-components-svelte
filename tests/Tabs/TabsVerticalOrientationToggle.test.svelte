<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";
  import type { ComponentProps } from "svelte";

  const orientations: ComponentProps<TabsVertical>["orientation"][] = [
    undefined,
    "horizontal",
    "vertical",
  ];
  let index = 0;
  $: orientation = orientations[index % orientations.length];
</script>

<button type="button" on:click={() => index++}>Next orientation</button>

<TabsVertical {orientation}>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" />
  <Tab label="Tab 3" />
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </svelte:fragment>
</TabsVertical>
