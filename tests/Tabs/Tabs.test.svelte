<script lang="ts">
import { Tabs, Tab, TabContent } from "carbon-components-svelte";

export let selected = 0;
export let type: "default" | "container" = "default";
export let autoWidth = false;
export let iconDescription = "Show menu options";
export let triggerHref = "#";
</script>

<Tabs
  {selected}
  {type}
  {autoWidth}
  {iconDescription}
  {triggerHref}
  on:change={({ detail }) => {
    console.log("change event", detail);
  }}
>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" disabled />
  <Tab label="Tab 3" />
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </svelte:fragment>
</Tabs>
