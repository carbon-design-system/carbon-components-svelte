<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import SwitchPanel from "carbon-components-svelte/ContentSwitcher/SwitchPanel.svelte";

  export let selectedIndex = 0;
  export let selectedId: string | undefined = undefined;
</script>

<ContentSwitcher {selectedIndex} {selectedId}>
  <Switch id="all" text="All" />
  <Switch id="active" text="Active" />
  <Switch id="archived" text="Archived" />
  <svelte:fragment slot="content">
    <SwitchPanel>All content</SwitchPanel>
    <SwitchPanel>Active content</SwitchPanel>
    <SwitchPanel>Archived content</SwitchPanel>
  </svelte:fragment>
</ContentSwitcher>
