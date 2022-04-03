<script>
  import { Modal } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";
</script>

<Modal
  open
  modalHeading="Invite someone"
  primaryButtonText="Send invitation"
  primaryButtonIcon="{Send}"
  secondaryButtonText="Cancel"
>
  <p>Do you really want to invite someone?</p>
</Modal>
