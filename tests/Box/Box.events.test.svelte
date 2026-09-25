<script lang="ts">
  import Box from "carbon-components-svelte/Box/Box.svelte";

  export let events: string[] = [];
</script>

<Box
  data-testid="target"
  on:click={() => (events = [...events, "click"])}
  on:scroll={() => (events = [...events, "scroll"])}
  on:keydown={(e) => (events = [...events, `keydown:${e.key}`])}
  on:focusin={() => (events = [...events, "focusin"])}
  on:focusout={() => (events = [...events, "focusout"])}
>
  <button type="button">Inner</button>
</Box>
<p data-testid="events">{events.join(",")}</p>
