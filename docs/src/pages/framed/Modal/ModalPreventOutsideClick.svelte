<script>
  import { Button, CodeSnippet, Modal, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create API key</Button>

<Modal
  passiveModal
  preventCloseOnClickOutside
  bind:open
  modalHeading="API key created"
  on:open
  on:close
>
  <Stack gap={5}>
    <p>
      Copy this key now. You can't view it again after you close this dialog.
    </p>
    <CodeSnippet code="cld_live_8f3a2c91e4b7d605" />
  </Stack>
</Modal>
