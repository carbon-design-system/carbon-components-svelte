<script lang="ts">
  import { CopyButton, Modal } from "carbon-components-svelte";
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
