<script>
  import {
    Button,
    Checkbox,
    InlineNotification,
    SignaturePad,
    Stack,
  } from "carbon-components-svelte";

  let value = $state(null);
  let agreed = $state(false);
  let approved = $state(false);

  function handleSubmit(event) {
    event.preventDefault();
    // For demo purposes only: send the value to your server instead.
    approved = true;
  }
</script>

<form onsubmit={handleSubmit}>
  <Stack gap={6}>
    <p>Approve invoice INV-2041 for $18,420.00 from Northwind Logistics.</p>
    <SignaturePad
      bind:value
      name="approval"
      required
      labelText="Approver signature"
      helperText="Draw your signature, or use the Type tab to type your name"
    />
    <Checkbox
      bind:checked={agreed}
      required
      labelText="I agree that this signature is my legal signature"
    />
    <Button type="submit">Approve invoice</Button>
    {#if approved}
      <InlineNotification
        lowContrast
        hideCloseButton
        kind="success"
        title="Approved"
        subtitle="Signed as {value?.type === 'typed'
          ? value.text
          : 'a drawn signature'}"
      />
    {/if}
  </Stack>
</form>
