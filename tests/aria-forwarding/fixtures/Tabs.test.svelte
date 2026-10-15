<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  /** Which component gets the rest props. */
  export let under: "tabs" | "tab" | "content" = "tabs";
  export let vertical = false;
</script>

<svelte:component
  this={vertical ? TabsVertical : Tabs}
  {...under === "tabs" ? $$restProps : {}}
>
  <Tab label="One" {...under === "tab" ? $$restProps : {}} />
  <Tab label="Two" />
  <svelte:fragment slot="content">
    <TabContent {...under === "content" ? $$restProps : {}}>One</TabContent>
    <TabContent>Two</TabContent>
  </svelte:fragment>
</svelte:component>
