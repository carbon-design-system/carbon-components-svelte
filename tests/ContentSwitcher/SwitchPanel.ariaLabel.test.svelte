<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import SwitchPanel from "carbon-components-svelte/ContentSwitcher/SwitchPanel.svelte";
</script>

<ContentSwitcher>
  <Switch id="one-switch" text="One" />
  <svelte:fragment slot="content">
    <SwitchPanel id="one-panel" {...$$restProps}>Content 1</SwitchPanel>
  </svelte:fragment>
</ContentSwitcher>
