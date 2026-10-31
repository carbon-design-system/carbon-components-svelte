<script>
  import { mediaQuery } from "carbon-components-svelte";

  const wideQuery = mediaQuery("(min-width: 600px)");
</script>

<p>Matches "(min-width: 600px)": {$wideQuery}</p>
