<script lang="ts">
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<NumberInput>["value"] = null;
  export let locale: ComponentProps<NumberInput>["locale"] = undefined;
  export let allowDecimal: ComponentProps<NumberInput>["allowDecimal"] = false;
  export let allowEmpty: ComponentProps<NumberInput>["allowEmpty"] = false;
  export let formatOptions: ComponentProps<NumberInput>["formatOptions"] =
    undefined;
  export let disabled: ComponentProps<NumberInput>["disabled"] = false;
  export let readonly: ComponentProps<NumberInput>["readonly"] = false;
  export let onChange: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <NumberInput
    bind:value
    {locale}
    {allowDecimal}
    {allowEmpty}
    {formatOptions}
    {disabled}
    {readonly}
    name="n"
    labelText="Amount"
    on:change={onChange}
  />
</form>
<p data-testid="bound">{JSON.stringify(value)}</p>
