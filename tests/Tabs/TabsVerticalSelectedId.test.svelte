<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  export let selected = 0;
  /** `undefined` keeps the index API; set a string to exercise `selectedId`. */
  export let selectedId: string | undefined = undefined;
  export let showTabA = true;
</script>

<TabsVertical
  bind:selected
  bind:selectedId
  on:change={({ detail }) => {
    console.log("change event", detail);
  }}
>
  {#if showTabA}
    <Tab id="tab-a" label="Tab A" />
  {/if}
  <Tab id="tab-b" label="Tab B" />
  <Tab id="tab-c" label="Tab C" />
  <svelte:fragment slot="content">
    {#if showTabA}
      <TabContent id="panel-a">Content A</TabContent>
    {/if}
    <TabContent id="panel-b">Content B</TabContent>
    <TabContent id="panel-c">Content C</TabContent>
  </svelte:fragment>
</TabsVertical>

<button
  type="button"
  data-testid="toggle-tab-a"
  on:click={() => (showTabA = !showTabA)}
>
  Toggle Tab A
</button>
<div data-testid="selected-index">{selected}</div>
<div data-testid="selected-id">{selectedId ?? ""}</div>
