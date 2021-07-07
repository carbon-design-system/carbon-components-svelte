<script>
  import { Breakpoint } from "carbon-components-svelte";

  let size;
  let events = [];
</script>

<Breakpoint bind:size on:match="{(e) => (events = [...events, e.detail])}" />

<h1>{size}</h1>

<pre>
    {JSON.stringify(events,null, 2)}
    </pre>
