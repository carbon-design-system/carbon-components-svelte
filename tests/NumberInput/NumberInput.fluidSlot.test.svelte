<script lang="ts">
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";

  export let fluid = true;
</script>

<NumberInput {fluid} labelText="Default label">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</NumberInput>
