<svelte:options accessors />

<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import type { ComponentProps } from "svelte";

  export let submitOnComplete: ComponentProps<PinCodeInput>["submitOnComplete"] = true;
  export let code: ComponentProps<PinCodeInput>["code"] = [];
  export let onSubmit: (value: FormDataEntryValue | null) => void = () => {};
</script>

<form
  data-testid="form"
  on:submit|preventDefault={(e) =>
    onSubmit(new FormData(e.currentTarget).get("otp"))}
>
  <PinCodeInput bind:code {submitOnComplete} name="otp" labelText="Code" />
</form>
