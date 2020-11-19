<script lang="ts">
  import { Button, Modal } from "../types";

  let open = false;
</script>

<Button kind="danger" on:click="{() => (open = true)}">Delete all</Button>

<Modal
  danger
  bind:open
  modalHeading="Delete all instances"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  on:click:button--secondary="{() => (open = false)}"
  on:open
  on:close
  on:submit
>
  <p>This is a permanent action and cannot be undone.</p>
</Modal>
