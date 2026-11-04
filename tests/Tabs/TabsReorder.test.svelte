<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let reorderable = true;
  /** Move the tab in the data, as an app would. */
  export let applyMove = true;
  /** Call `preventDefault()` on the event. */
  export let refuse = false;
  export let reorderHintText: string | undefined = undefined;
  export let onReorder: (detail: unknown) => void = () => {};
  export let labels = ["Alpha", "Bravo", "Charlie"];

  let selectedId = "b";
  let tabs = labels.map((label, i) => ({ id: "abc"[i], label }));
</script>

<Tabs
  bind:selectedId
  {reorderable}
  {...reorderHintText === undefined ? {} : { reorderHintText }}
  on:reorder={(event) => {
    onReorder(event.detail);
    if (refuse) event.preventDefault();
    if (!applyMove || refuse) return;
    const { oldIndex, newIndex } = event.detail;
    const next = [...tabs];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    tabs = next;
  }}
>
  {#each tabs as tab (tab.id)}
    <Tab id={tab.id} label={tab.label} aria-describedby="own-note" />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
<p id="own-note">Own note</p>
