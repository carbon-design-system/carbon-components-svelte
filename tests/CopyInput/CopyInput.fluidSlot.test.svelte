<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";

  export let fluid = true;
</script>

<CopyInput {fluid} labelText="API token" value="sk-1234567890abcdef">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</CopyInput>
