<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  export let selected = 0;
  export let type: "default" | "container" = "default";
  export let autoWidth = false;
  export let iconDescription = "Show menu options";
  export let triggerHref = "#";
  export let customClass = "";
  export let ariaLabel = "";
</script>

<Tabs
  {selected}
  {type}
  {autoWidth}
  {iconDescription}
  {triggerHref}
  class={customClass}
  aria-label={ariaLabel === undefined ? undefined : ariaLabel}
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
