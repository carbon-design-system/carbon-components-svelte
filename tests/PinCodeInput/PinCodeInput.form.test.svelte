<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import type { ComponentProps } from "svelte";

  export let count: ComponentProps<PinCodeInput>["count"] = 4;
  export let value: ComponentProps<PinCodeInput>["value"] = "";
  export let required: ComponentProps<PinCodeInput>["required"] = false;
  export let onClear: () => void = () => {};
  export let onComplete: () => void = () => {};
  export let onChange: () => void = () => {};
</script>

<form data-testid="form">
  <PinCodeInput
    bind:value
    {count}
    {required}
    name="otp"
    labelText="Code"
    on:clear={onClear}
    on:complete={onComplete}
    on:change={onChange}
  />
</form>
<p data-testid="bound">{value}</p>
