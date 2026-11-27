<script>
  import { Button, Dialog, Stack, Text } from "carbon-components-svelte";

  let open = false;
  let dialog;
  let returnValue = "";
</script>

<Stack gap={5}>
  <Button on:click={() => (open = true)}>Review request</Button>
  {#if returnValue}
    <Text>Last decision: <code>{returnValue}</code></Text>
  {/if}
</Stack>

<Dialog
  bind:open
  bind:this={dialog}
  bind:returnValue
  modal
  aria-label="Review request"
>
  <Stack gap={5}>
    <p>Approve or reject this request. Either action closes the dialog.</p>
    <Stack orientation="horizontal" gap={3}>
      <Button on:click={() => dialog.close("approved")}>Approve</Button>
      <Button kind="secondary" on:click={() => dialog.close("rejected")}>
        Reject
      </Button>
    </Stack>
  </Stack>
</Dialog>
