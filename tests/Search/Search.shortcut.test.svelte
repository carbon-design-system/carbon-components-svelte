<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let value = "";
  export let preventShortcut = false;
</script>

<div data-testid="search">
  <Search
    shortcut="/"
    bind:value
    on:shortcut={(e) => {
      if (preventShortcut) e.preventDefault();
    }}
  />
</div>
<div data-testid="expandable">
  <Search expandable shortcut="ctrl+shift+f" />
</div>
<input data-testid="other" />
