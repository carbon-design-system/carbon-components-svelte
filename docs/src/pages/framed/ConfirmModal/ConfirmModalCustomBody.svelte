<script>
  import {
    Button,
    ConfirmModal,
    ListItem,
    UnorderedList,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button kind="danger" on:click={() => (open = true)}>Remove members</Button>

<ConfirmModal bind:open heading="Remove these members?" confirmText="Remove">
  <p>The following members will lose access to this workspace:</p>
  <UnorderedList>
    <ListItem>Ava Chen</ListItem>
    <ListItem>Marcus Reed</ListItem>
    <ListItem>Priya Nair</ListItem>
  </UnorderedList>
</ConfirmModal>
