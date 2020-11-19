<script lang="ts">
  import { Modal } from "../types";
</script>

<Modal
  preventCloseOnClickOutside
  open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--secondary
  on:open
  on:close
  on:submit
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>
