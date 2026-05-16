<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalTooltip: ComponentProps<Button>["portalTooltip"] = undefined;
</script>

<Modal
  bind:open={modalOpen}
  modalHeading="Test"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
>
  <Button
    data-testid="btn-icon-modal"
    icon={Add}
    iconDescription="Tooltip text"
    {portalTooltip}
  />
</Modal>
