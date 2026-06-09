<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = undefined;
</script>

<Modal
  bind:open={modalOpen}
  modalHeading="Test"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
>
  <OverflowMenu {portalMenu}>
    <OverflowMenuItem text="Option 1" />
    <OverflowMenuItem text="Option 2" />
  </OverflowMenu>
</Modal>
