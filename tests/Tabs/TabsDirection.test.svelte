<script lang="ts">
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  export let context = true;
  /** Renders `TabsVertical` in the given orientation instead of `Tabs`. */
  export let vertical: "horizontal" | "vertical" | undefined = undefined;

  $: Component = (vertical ? TabsVertical : Tabs) as typeof Tabs;
</script>

{#if context}
  <LayoutDirection {dir}>
    <svelte:component
      this={Component}
      {...vertical ? { orientation: vertical } : {}}
    >
      <Tab label="Overview" />
      <Tab label="Logs" />
      <Tab label="Settings" />
    </svelte:component>
  </LayoutDirection>
{:else}
  <svelte:component
    this={Component}
    {...vertical ? { orientation: vertical } : {}}
  >
    <Tab label="Overview" />
    <Tab label="Logs" />
    <Tab label="Settings" />
  </svelte:component>
{/if}
