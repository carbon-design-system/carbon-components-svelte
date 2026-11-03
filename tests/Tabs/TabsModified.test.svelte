<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Calendar from "../../src/icons/Calendar.svelte";

  export let dismissible = true;
  export let iconOnly = false;
  export let modifiedText: string | undefined = undefined;
  /** Call `preventDefault()` on `dismiss`. */
  export let refuse = false;
  export let onDismiss: (detail: unknown) => void = () => {};

  let selectedId = "a";
  let tabs = [
    { id: "a", label: "Alpha", modified: false },
    { id: "b", label: "Bravo", modified: true },
    { id: "c", label: "Charlie", modified: false },
  ];
</script>

<Tabs
  bind:selectedId
  {dismissible}
  {iconOnly}
  {...modifiedText === undefined ? {} : { modifiedText }}
  on:dismiss={(event) => {
    onDismiss(event.detail);
    if (refuse) {
      event.preventDefault();
      return;
    }
    tabs = tabs.filter((tab) => tab.id !== event.detail.id);
  }}
>
  {#each tabs as tab (tab.id)}
    <Tab
      id={tab.id}
      label={tab.label}
      modified={tab.modified}
      icon={iconOnly ? Calendar : undefined}
    />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
