<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = false;
</script>

<ComposedModal open on:close={(e) => onclose?.(e)}>
  <ModalHeader title="Modal with overflow menu" />
  <ModalBody>
    <OverflowMenu iconDescription="More options" {portalMenu}>
      <OverflowMenuItem text="Download" />
      <OverflowMenuItem text="Share" />
    </OverflowMenu>
  </ModalBody>
</ComposedModal>
