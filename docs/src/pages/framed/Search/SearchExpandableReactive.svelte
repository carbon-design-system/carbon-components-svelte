<script>
  import { Search } from "carbon-components-svelte";

  let expanded = false;
</script>

<Search expandable bind:expanded on:expand on:collapse />

<br />

<strong>Expanded:</strong>
{expanded}
