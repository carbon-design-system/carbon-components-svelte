<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";

  export let fluid = true;
</script>

<PinCodeInput {fluid} labelText="Default label">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</PinCodeInput>
