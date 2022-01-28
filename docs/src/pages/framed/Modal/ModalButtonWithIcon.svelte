<script>
  import { Modal } from "carbon-components-svelte";
  import Send16 from "carbon-icons-svelte/lib/Send16";
</script>

<Modal
  open
  modalHeading="Invite someone"
  primaryButtonText="Send invitation"
  primaryButtonIcon="{Send16}"
  secondaryButtonText="Cancel"
>
  <p>Do you really want to invite someone?</p>
</Modal>
