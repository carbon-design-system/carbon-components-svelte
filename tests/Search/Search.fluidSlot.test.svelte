<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let fluid = true;
</script>

<Search {fluid} labelText="Default label">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</Search>
