<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = false;
</script>

<Modal
  open
  passiveModal
  modalHeading="Modal with overflow menu"
  on:close={(e) => onclose?.(e)}
>
  <OverflowMenu iconDescription="More options" {portalMenu}>
    <OverflowMenuItem text="Download" />
    <OverflowMenuItem text="Share" />
  </OverflowMenu>
</Modal>
