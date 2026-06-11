<script lang="ts">
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";

  export let fluid = true;
</script>

<PasswordInput {fluid} labelText="Default label">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</PasswordInput>
