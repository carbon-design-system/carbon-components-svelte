<script lang="ts">
  import ActionSet from "carbon-components-svelte/ActionSet/ActionSet.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import SidePanel from "carbon-components-svelte/SidePanel/SidePanel.svelte";

  export let open = true;
</script>

<SidePanel {open} title="Panel title" data-testid="side-panel">
  Body content
  <svelte:fragment slot="actions">
    <ActionSet>
      <Button kind="secondary">Cancel</Button>
      <Button>Save</Button>
    </ActionSet>
  </svelte:fragment>
</SidePanel>
