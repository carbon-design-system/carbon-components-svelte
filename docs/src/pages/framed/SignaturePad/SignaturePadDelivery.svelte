<script>
  import {
    Button,
    InlineNotification,
    SignaturePad,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let recipient = $state("");
  let value = $state(null);
  let confirmed = $state(false);
</script>

<Stack gap={5}>
  <p>Order 88412 · 3 pallets · Dock 4, Rotterdam</p>
  <TextInput
    labelText="Recipient name"
    placeholder="Who is receiving the delivery?"
    bind:value={recipient}
  />
  <!-- A squarer area, so a thumb has room on a phone. -->
  <SignaturePad
    bind:value
    modes={["draw", "type"]}
    aspectRatio={2}
    labelText="Recipient signature"
    helperText="Hand the device to the recipient to sign"
  />
  <Button
    disabled={!value || !recipient.trim()}
    on:click={() => (confirmed = true)}
  >
    Confirm delivery
  </Button>
  {#if confirmed}
    <InlineNotification
      lowContrast
      hideCloseButton
      kind="success"
      title="Delivery confirmed"
      subtitle="Signed by {recipient.trim()}"
    />
  {/if}
</Stack>
