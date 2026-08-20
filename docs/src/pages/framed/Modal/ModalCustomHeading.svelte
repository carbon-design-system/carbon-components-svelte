<script>
  import { Button, Modal, Tag } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<Modal
  bind:open
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <svelte:fragment slot="label">
    Cloudant <Tag type="green" size="sm">Beta</Tag>
  </svelte:fragment>
  <svelte:fragment slot="heading">Create database</svelte:fragment>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>
