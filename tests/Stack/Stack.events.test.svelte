<script lang="ts">
  import Stack from "carbon-components-svelte/Stack/Stack.svelte";

  export let events: string[] = [];
</script>

<Stack
  data-testid="target"
  on:click={() => (events = [...events, "click"])}
  on:scroll={() => (events = [...events, "scroll"])}
  on:keydown={(e) => (events = [...events, `keydown:${e.key}`])}
  on:focusin={() => (events = [...events, "focusin"])}
  on:focusout={() => (events = [...events, "focusout"])}
>
  <button type="button">Inner</button>
</Stack>
<p data-testid="events">{events.join(",")}</p>
