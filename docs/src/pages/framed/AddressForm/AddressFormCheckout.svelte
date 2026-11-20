<script>
  import {
    AddressForm,
    Button,
    Checkbox,
    Form,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let email = "";
  let shipping = { country: "US" };
  let billing = { country: "US" };
  let sameAsShipping = true;
  let shippingForm;
  let billingForm;
  let placed = false;

  function submit(event) {
    event.preventDefault();
    const shippingResult = shippingForm.validate();
    const billingResult = sameAsShipping
      ? { valid: true }
      : billingForm.validate();
    placed = shippingResult.valid && billingResult.valid;
  }
</script>

<Form on:submit={submit}>
  <Stack gap={7}>
    <TextInput
      labelText="Email"
      type="email"
      autocomplete="email"
      required
      bind:value={email}
    />
    <AddressForm
      bind:this={shippingForm}
      bind:value={shipping}
      legendText="Shipping address"
      include={["name"]}
      requiredFields={["name"]}
      autocompletePrefix="shipping"
      name="shipping"
    />
    <Checkbox
      labelText="Billing address is the same as shipping"
      bind:checked={sameAsShipping}
    />
    {#if !sameAsShipping}
      <AddressForm
        bind:this={billingForm}
        bind:value={billing}
        legendText="Billing address"
        include={["name", "organization"]}
        requiredFields={["name"]}
        autocompletePrefix="billing"
        name="billing"
      />
    {/if}
    <Button type="submit">Continue to payment</Button>
    {#if placed}
      <div role="status">Addresses accepted</div>
    {/if}
  </Stack>
</Form>
