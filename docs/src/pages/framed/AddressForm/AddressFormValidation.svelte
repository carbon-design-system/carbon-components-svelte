<script>
  import { AddressForm, Button, Form, Stack } from "carbon-components-svelte";

  let value = { country: "GB", postalCode: "SW1A" };
  let form;
  let status = "";

  function submit(event) {
    event.preventDefault();
    const { valid } = form.validate();
    status = valid ? "Address saved" : "Fix the fields marked invalid";
  }
</script>

<Form on:submit={submit}>
  <Stack gap={6}>
    <AddressForm bind:this={form} bind:value legendText="Delivery address" />
    <Button type="submit">Save address</Button>
    <div role="status">{status}</div>
  </Stack>
</Form>
