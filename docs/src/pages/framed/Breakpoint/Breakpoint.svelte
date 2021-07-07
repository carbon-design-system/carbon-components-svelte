<script>
  import { Breakpoint } from "carbon-components-svelte";

  let size;
  let events = [];
</script>

<Breakpoint bind:size on:match="{(e) => (events = [...events, e.detail])}" />

<p>Resize the width of your browser.</p>
<h6>Current breakpoint size</h6>
<h1>{size}</h1>

<pre>
  {JSON.stringify(events,null, 2)}
</pre>

<style>
  p,
  h1 {
    margin-bottom: var(--cds-spacing-08);
  }
</style>
