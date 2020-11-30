<script>
  import {
    ButtonSet,
    Button,
    Tabs,
    Tab,
    TabContent,
  } from "carbon-components-svelte";
  import { afterUpdate } from "svelte";

  let tabs = [
    { title: "blue", visible: true },
    { title: "green", visible: false },
    { title: "red", visible: true },
  ];

  let selected = 0;

  afterUpdate(() => {
    // if the selected tab is not visible
    // reset the index to the next visible tab
    if (tabs[selected].visible === false) {
      selected = tabs.filter((tab) => tab.visible).length - 1;
    }
  });
</script>

<style>
  div {
    margin: var(--cds-layout-02) 0;
  }
</style>

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

<div>
  <ButtonSet>
    {#each tabs as { title } (title)}
      <Button
        kind="tertiary"
        size="small"
        on:click="{() => {
          tabs = tabs.map((tab) => ({
            ...tab,
            visible: tab.title === title ? !tab.visible : tab.visible,
          }));
        }}"
      >
        Toggle
        {title}
        tab
      </Button>
    {/each}
  </ButtonSet>
</div>

<div>
  <Button
    size="small"
    on:click="{() => {
      selected = 1;
    }}"
  >
    Set selected to 1
  </Button>
</div>
