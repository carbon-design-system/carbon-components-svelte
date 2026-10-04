<svelte:options accessors />

<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";

  export let value = "a1b2c3d4";
</script>

<form data-testid="form">
  <CopyInput {value} name="apiKey" labelText="API key" />
</form>
