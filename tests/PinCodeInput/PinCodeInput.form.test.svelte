<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import type { ComponentProps } from "svelte";

  export let count: ComponentProps<PinCodeInput>["count"] = 4;
  export let value: ComponentProps<PinCodeInput>["value"] = "";
  export let required: ComponentProps<PinCodeInput>["required"] = false;
</script>

<form data-testid="form">
  <PinCodeInput bind:value {count} {required} name="otp" labelText="Code" />
</form>
