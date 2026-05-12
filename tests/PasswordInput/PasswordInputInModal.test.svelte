<script lang="ts">
  import { Modal, PasswordInput } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalTooltip: ComponentProps<PasswordInput>["portalTooltip"] =
    undefined;
</script>

<Modal
  bind:open={modalOpen}
  modalHeading="Test"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
>
  <PasswordInput
    labelText="Password"
    placeholder="Enter password..."
    {portalTooltip}
  />
</Modal>
