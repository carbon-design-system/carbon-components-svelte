<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<Modal
  bind:open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtons={[
    { text: "Cancel", kind: "ghost" },
    { text: "Save draft", kind: "secondary" },
  ]}
  on:click:button--secondary={({ detail }) => {
    if (detail.text === "Cancel") open = false;
    if (detail.text === "Save draft") console.log("Save draft");
  }}
  on:open
  on:close
  on:submit
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>
