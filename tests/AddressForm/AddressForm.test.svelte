<svelte:options accessors />

<script lang="ts">
  import AddressForm from "carbon-components-svelte/AddressForm/AddressForm.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<AddressForm>["value"] = {};
  export let onChange: ((detail: unknown) => void) | undefined = undefined;
  export let onCountryChange: ((detail: unknown) => void) | undefined =
    undefined;

  let form: AddressForm;
  export function validate() {
    return form.validate();
  }
</script>

<form data-testid="form">
  <AddressForm
    bind:this={form}
    bind:value
    legendText="Shipping address"
    on:change={(event) => onChange?.(event.detail)}
    on:countrychange={(event) => onCountryChange?.(event.detail)}
    {...$$restProps}
  />
  <button type="reset">Reset</button>
</form>
<pre data-testid="value">{JSON.stringify(value)}</pre>
