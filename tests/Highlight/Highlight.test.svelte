<script lang="ts">
  import Highlight from "carbon-components-svelte/Highlight/Highlight.svelte";

  export let text = "Café au lait";
  export let query = "cafe";
  export let dir: "ltr" | "rtl" = "ltr";
</script>

<button type="button" {dir} data-testid="host"
  ><Highlight {text} {query} /></button
>
<p {dir} data-testid="plain"><Highlight {text} {query} decorative /></p>
