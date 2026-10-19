<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";
  import type { ComponentProps } from "svelte";

  export let selected = 0;
  export let activation: ComponentProps<Tabs>["activation"] = "automatic";
  export let type: ComponentProps<Tabs>["type"] = "default";
  export let autoWidth = false;
  export let fullWidth = false;
  export let dismissible = false;
  export let size: ComponentProps<Tabs>["size"] = undefined;
  export let customClass = "";
  export let ariaLabel = "";
  /** Applies `flush` to the first panel only. */
  export let flush = false;
  /** Renders `TabsVertical` instead of `Tabs`; `type`, `autoWidth`, `fullWidth`, `dismissible`, `customClass` and `ariaLabel` are `Tabs`-only. */
  export let vertical = false;
  /** Only read by `TabsVertical`. */
  export let orientation: ComponentProps<TabsVertical>["orientation"] =
    undefined;
  /** Appends a fourth, enabled tab. */
  export let extraTab = false;
  export let onChange: (index: number) => void = () => {};

  $: Component = (vertical ? TabsVertical : Tabs) as typeof Tabs;
</script>

<svelte:component
  this={Component}
  {selected}
  {activation}
  {size}
  {...vertical
    ? { orientation }
    : {
        type,
        autoWidth,
        fullWidth,
        dismissible,
        class: customClass,
        "aria-label": ariaLabel === undefined ? undefined : ariaLabel,
      }}
  on:change={({ detail }) => onChange(detail)}
>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" disabled />
  <Tab label="Tab 3" />
  {#if extraTab}
    <Tab label="Tab 4" />
  {/if}
  <svelte:fragment slot="content">
    <TabContent {flush}>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
    {#if extraTab}
      <TabContent>Content 4</TabContent>
    {/if}
  </svelte:fragment>
</svelte:component>
