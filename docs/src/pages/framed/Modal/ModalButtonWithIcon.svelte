<script>
  import { Button, Modal } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<Modal
  bind:open
  modalHeading="Invite someone"
  primaryButtonText="Send invitation"
  primaryButtonIcon={Send}
  secondaryButtonText="Cancel"
>
  <p>Do you really want to invite someone?</p>
</Modal>
