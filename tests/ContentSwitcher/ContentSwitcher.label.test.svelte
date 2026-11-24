<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import SwitchPanel from "carbon-components-svelte/ContentSwitcher/SwitchPanel.svelte";

  export let labelText = "Motion";
  export let hideLabel = false;
  export let ariaLabel: string | undefined = undefined;
  export let showFirstPanel = true;
</script>

<ContentSwitcher {labelText} {hideLabel} aria-label={ariaLabel}>
  <Switch id="productive-switch" text="Productive" />
  <Switch id="expressive-switch" text="Expressive" />
  <svelte:fragment slot="content">
    {#if showFirstPanel}
      <SwitchPanel id="productive-panel">Productive content</SwitchPanel>
    {/if}
    <SwitchPanel id="expressive-panel">Expressive content</SwitchPanel>
  </svelte:fragment>
</ContentSwitcher>
