<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import SwitchPanel from "carbon-components-svelte/ContentSwitcher/SwitchPanel.svelte";

  export let selectedIndex = 0;
  export let lazy = false;
  export let unmountOnHide = false;
  export let showFirstPanel = true;
</script>

<ContentSwitcher bind:selectedIndex aria-label="Views">
  <Switch id="one-switch" text="One" />
  <Switch id="two-switch" text="Two" />
  <Switch id="three-switch" text="Three" aria-controls="custom-panel" />
  <svelte:fragment slot="content">
    {#if showFirstPanel}
      <SwitchPanel id="one-panel" {lazy} {unmountOnHide}>Content 1</SwitchPanel>
    {/if}
    <SwitchPanel id="two-panel" {lazy} {unmountOnHide}>Content 2</SwitchPanel>
    <SwitchPanel id="three-panel" {lazy} {unmountOnHide}>Content 3</SwitchPanel>
  </svelte:fragment>
</ContentSwitcher>
<div data-testid="selected-index">{selectedIndex}</div>
