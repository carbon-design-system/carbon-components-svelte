<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import SwitchPanel from "carbon-components-svelte/ContentSwitcher/SwitchPanel.svelte";

  export let items = ["a", "b", "c"];
  export let selectedIndex = 0;
</script>

<ContentSwitcher bind:selectedIndex>
  {#each items as item (item)}
    <Switch id={item} text={item.toUpperCase()} />
  {/each}
  <svelte:fragment slot="content">
    {#each items as item (item)}
      <SwitchPanel id="{item}-panel">{item}</SwitchPanel>
    {/each}
  </svelte:fragment>
</ContentSwitcher>

<div data-testid="selected-index">{selectedIndex}</div>
