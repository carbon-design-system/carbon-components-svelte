<script lang="ts">
  import { Modal, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = undefined;
</script>

<Modal bind:open={modalOpen} modalHeading="Test" primaryButtonText="OK" secondaryButtonText="Cancel">
  <OverflowMenu {portalMenu}>
    <OverflowMenuItem text="Option 1" />
    <OverflowMenuItem text="Option 2" />
  </OverflowMenu>
</Modal>
