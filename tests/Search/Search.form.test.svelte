<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let value = "";
</script>

<form data-testid="form">
  <Search bind:value name="field" labelText="Query" />
</form>
<p data-testid="bound">{value}</p>
