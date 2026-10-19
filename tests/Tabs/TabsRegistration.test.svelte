<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  /** Renders `TabsVertical` instead of a dismissible container `Tabs`. */
  export let vertical = false;
  export let onDismiss: (detail: {
    label: string;
    disabled: boolean;
    index: number;
  }) => void = () => {};

  $: Component = (vertical ? TabsVertical : Tabs) as typeof Tabs;

  let count = "";
  let label = "Engage";
  let disabled = true;
</script>

<svelte:component
  this={Component}
  {...vertical ? {} : { type: "container", dismissible: true }}
  on:dismiss={({ detail }) => onDismiss(detail)}
>
  <Tab {label} secondaryLabel={count} />
  <Tab label="Analyze" {disabled} />
  <svelte:fragment slot="content">
    <TabContent>Engage content</TabContent>
    <TabContent>Analyze content</TabContent>
  </svelte:fragment>
</svelte:component>

<button type="button" on:click={() => (count = "(3/4)")}>Load count</button>
<button type="button" on:click={() => (count = "")}>Clear count</button>
<button type="button" on:click={() => (label = "Renamed")}>Rename</button>
<button type="button" on:click={() => (disabled = false)}>Enable</button>
