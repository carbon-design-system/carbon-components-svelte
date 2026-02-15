<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  export let selected = 0;
  export let showTab1 = true;
  export let showTab2 = true;
</script>

<Tabs
  bind:selected
  on:change={({ detail }) => {
    console.log("change event", detail);
  }}
>
  {#if showTab1}
    <Tab label="Tab 1" />
  {/if}
  {#if showTab2}
    <Tab label="Tab 2" />
  {/if}
  <Tab label="Tab 3" />
  <svelte:fragment slot="content">
    {#if showTab1}
      <TabContent>Content 1</TabContent>
    {/if}
    {#if showTab2}
      <TabContent>Content 2</TabContent>
    {/if}
    <TabContent>Content 3</TabContent>
  </svelte:fragment>
</Tabs>

<button type="button" data-testid="toggle-tab1" on:click={() => (showTab1 = !showTab1)}>
  Toggle Tab 1
</button>
<button type="button" data-testid="toggle-tab2" on:click={() => (showTab2 = !showTab2)}>
  Toggle Tab 2
</button>
<div data-testid="selected-index">{selected}</div>
