<script lang="ts">
  import { Button, Modal } from "../types";

  let open = false;
</script>

<Button on:click="{() => (open = true)}">Create database</Button>

<Modal
  bind:open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtons="{[{ text: 'Cancel' }, { text: 'Duplicate' }]}"
  secondaryButtonText="Cancel"
  on:click:button--secondary="{({ detail }) => (open = false)}"
  on:open
  on:close
  on:submit
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>
