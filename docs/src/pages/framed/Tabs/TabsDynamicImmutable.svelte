<script>
  import { Button, Tabs, Tab, TabContent } from "carbon-components-svelte";

  let tabs = [
    { title: "blue", visible: true },
    { title: "green", visible: false },
    { title: "red", visible: true },
  ];

  const toggleTab = (title) => {
    tabs = tabs.map((tab) => ({
      ...tab,
      visible: tab.title === title ? !tab.visible : tab.visible,
    }));
  };

  let selected = 0;
</script>

<svelte:options immutable />

{#key tabs}
  <Tabs bind:selected>
    {#each tabs as tab (tab.title)}
      {#if tab.visible}
        <Tab label="{tab.title}" />
      {/if}
    {/each}
    <div slot="content">
      {#each tabs as tab (tab.title)}
        {#if tab.visible}
          <TabContent>Content for {tab.title}</TabContent>
        {/if}
      {/each}
    </div>
  </Tabs>
{/key}

<p>Selected index: {selected}</p>

{#each tabs as { title } (title)}
  <Button on:click="{() => toggleTab(title)}">Toggle {title} tab</Button>
{/each}
