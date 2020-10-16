<script>
  // TODO: [refactor] parse search parameters more reliably
  $: currentTheme = window.location.search.split("?theme=")[1];
  $: document.documentElement.setAttribute("theme", currentTheme);
</script>

<style>
  :global(body) {
    min-height: 100vh;
    width: 100%;
    padding: var(--cds-spacing-06) var(--cds-spacing-05);
  }
</style>

<slot />
