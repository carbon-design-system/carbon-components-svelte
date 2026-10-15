<svelte:options accessors />

<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";

  export let value = "a1b2c3d4";
  export let maskedValue: string | undefined = undefined;
</script>

<form data-testid="form">
  <CopyInput {value} {maskedValue} name="apiKey" labelText="API key" />
</form>
