<script lang="ts">
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  export let fluid = true;
</script>

<TextInput {fluid} labelText="Default label">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</TextInput>
