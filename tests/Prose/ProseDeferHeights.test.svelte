<script lang="ts">
  import Prose from "carbon-components-svelte/Prose/Prose.svelte";

  export let lines = 3;

  $: code = Array.from({ length: lines }, (_, i) => `line ${i}`).join("\n");
</script>

<Prose deferOffscreen>
  <pre
    data-testid="pre"
    style="content-visibility: auto; line-height: 20px; font-size: 16px; padding: 0">{code}</pre>
</Prose>
