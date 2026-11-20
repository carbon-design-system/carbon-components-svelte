<script>
  import DiffViewer from "carbon-components-svelte/DiffViewer/DiffViewer.svelte";

  export let view = "split";
  export let current = -1;

  let moved = "";
</script>

<DiffViewer
  bind:view
  bind:current
  {...$$restProps}
  on:navigate={(event) => (moved = JSON.stringify(event.detail))}
/>
<output data-testid="moved">{moved}</output>
<output data-testid="view">{view}</output>
<output data-testid="current">{current}</output>
