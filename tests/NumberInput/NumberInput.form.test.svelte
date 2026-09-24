<script lang="ts">
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<NumberInput>["value"] = null;
  export let locale: ComponentProps<NumberInput>["locale"] = undefined;
  export let allowDecimal: ComponentProps<NumberInput>["allowDecimal"] = false;
  export let formatOptions: ComponentProps<NumberInput>["formatOptions"] =
    undefined;
  export let disabled: ComponentProps<NumberInput>["disabled"] = false;
  export let allowEmpty: ComponentProps<NumberInput>["allowEmpty"] = false;
  export let readonly: ComponentProps<NumberInput>["readonly"] = false;
</script>

<form data-testid="form">
  <NumberInput
    bind:value
    {locale}
    {allowDecimal}
    {formatOptions}
    {disabled}
    {allowEmpty}
    {readonly}
    name="n"
    labelText="Amount"
  />
</form>
<p data-testid="bound">{String(value)}</p>
