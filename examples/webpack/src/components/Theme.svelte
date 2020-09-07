<script>
  export let theme = "white";

  $: document.documentElement.setAttribute("theme", theme);
</script>

<slot />
