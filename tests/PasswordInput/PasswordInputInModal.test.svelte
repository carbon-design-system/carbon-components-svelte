<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
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
