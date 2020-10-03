<script>
  // TODO: [refactor] parse search parameters more reliably
  $: currentTheme = window.location.search.split("?theme=")[1];
  $: document.documentElement.setAttribute("theme", currentTheme);
</script>

<slot />
