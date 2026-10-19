<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  export let selected = 0;
  /** `undefined` keeps the index API; set a string to exercise `selectedId`. */
  export let selectedId: string | undefined = undefined;
  export let showTabA = true;
  export let showTabB = true;
  export let showTabC = true;
  /** Renders `TabsVertical` instead of `Tabs`. */
  export let vertical = false;
</script>

<svelte:component
  this={vertical ? TabsVertical : Tabs}
  bind:selected
  bind:selectedId
>
  {#if showTabA}
    <Tab id="tab-a" label="Tab A" />
  {/if}
  {#if showTabB}
    <Tab id="tab-b" label="Tab B" />
  {/if}
  {#if showTabC}
    <Tab id="tab-c" label="Tab C" />
  {/if}
  <svelte:fragment slot="content">
    {#if showTabA}
      <TabContent id="panel-a">Content A</TabContent>
    {/if}
    {#if showTabB}
      <TabContent id="panel-b">Content B</TabContent>
    {/if}
    {#if showTabC}
      <TabContent id="panel-c">Content C</TabContent>
    {/if}
  </svelte:fragment>
</svelte:component>

<button
  type="button"
  data-testid="toggle-tab-a"
  on:click={() => (showTabA = !showTabA)}
>
  Toggle Tab A
</button>
<button
  type="button"
  data-testid="toggle-tab-b"
  on:click={() => (showTabB = !showTabB)}
>
  Toggle Tab B
</button>
<button
  type="button"
  data-testid="toggle-tab-c"
  on:click={() => (showTabC = !showTabC)}
>
  Toggle Tab C
</button>
<div data-testid="selected-index">{selected}</div>
<div data-testid="selected-id">{selectedId ?? ""}</div>
