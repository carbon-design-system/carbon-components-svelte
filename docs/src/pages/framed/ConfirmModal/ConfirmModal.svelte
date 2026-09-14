<script>
  import { Button, ConfirmModal, Text } from "carbon-components-svelte";

  let open = false;
  let result = "";
</script>

<Button kind="danger" on:click={() => (open = true)}>Delete file</Button>

{#if result}
  <Text>Result: {result}</Text>
{/if}

<ConfirmModal
  bind:open
  title="Delete this file?"
  confirmText="Delete"
  on:confirm={() => (result = "confirmed")}
  on:cancel={(e) => (result = `canceled (${e.detail.trigger})`)}
>
  <p>This action cannot be undone.</p>
</ConfirmModal>
