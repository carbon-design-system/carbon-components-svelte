<script>
  import { Button, Modal } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Invite teammate</Button>

<Modal
  bind:open
  modalHeading="Invite teammate"
  primaryButtonText="Send invitation"
  primaryButtonIcon={Send}
  secondaryButtonText="Cancel"
>
  <p>An email invitation with a link to join the workspace will be sent.</p>
</Modal>
