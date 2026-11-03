<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";

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
<div data-testid="header">
  <HeaderSearch shortcut="ctrl+k" />
</div>
<input data-testid="other" />
