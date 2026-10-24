<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  export let items = ["examples", "api", "changelog"];
  export let selected = 0;
  /** Renders `TabsVertical` instead of `Tabs`. */
  export let vertical = false;

  $: Component = (vertical ? TabsVertical : Tabs) as typeof Tabs;
</script>

<svelte:component
  this={Component}
  navigation
  aria-label="Component"
  bind:selected
>
  {#each items as item (item)}
    <Tab
      id={item}
      label={item[0].toUpperCase() + item.slice(1)}
      href="#{item}"
      disabled={item === "changelog"}
    />
  {/each}
  <div slot="content" data-testid="page">Page {selected}</div>
</svelte:component>
