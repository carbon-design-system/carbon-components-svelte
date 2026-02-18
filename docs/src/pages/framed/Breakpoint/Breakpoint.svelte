<script>
  import { Breakpoint, Stack } from "carbon-components-svelte";

  let size;
  let events = [];
</script>

<Stack gap={5}>
  <Breakpoint bind:size on:change={(e) => (events = [...events, e.detail])} />
  <p>Resize the width of your browser.</p>
  <div>
    <h6>Breakpoint size</h6>
    <h1>{size}</h1>
  </div>
  <div>
    <h6>on:change</h6>
    <pre>{JSON.stringify(events, null, 2)}</pre>
  </div>
</Stack>
