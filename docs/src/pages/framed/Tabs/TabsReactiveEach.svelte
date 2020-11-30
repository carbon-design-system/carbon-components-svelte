<script>
  import { Button, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { afterUpdate } from "svelte";

  let selected = 0;
  let update = false;

  $: items = update ? [1, 2, 3, 4, 5, 6] : [1, 2, 3];

  afterUpdate(() => {
    // reset the selected index of tab no longer exists
    if (items[selected] === undefined) {
      selected = 0;
    }
  });
</script>

<style>
  div {
    margin: var(--cds-layout-02) 0;
  }
</style>

{#key items}
  <Tabs bind:selected>
    {#each items as item}
      <Tab label="Tab label {item}" />
    {/each}
    <div slot="content">
      {#each items as item}
        <TabContent>Content {item}</TabContent>
      {/each}
    </div>
  </Tabs>
{/key}

<div>
  <Button
    size="small"
    kind="tertiary"
    on:click="{() => {
      update = !update;
    }}"
  >
    Update items
  </Button>
</div>

<div>
  <Button
    size="small"
    disabled="{selected === 1}"
    on:click="{() => {
      selected = 1;
    }}"
  >
    Set selected index to 1
  </Button>
</div>

<div>Selected index: {selected}</div>
