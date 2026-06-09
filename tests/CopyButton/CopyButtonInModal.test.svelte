<script lang="ts">
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalTooltip: ComponentProps<CopyButton>["portalTooltip"] =
    undefined;
</script>

<Modal
  bind:open={modalOpen}
  modalHeading="Test"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
>
  <CopyButton text="copy me" iconDescription="Copy" {portalTooltip} />
</Modal>
