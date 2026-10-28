<svelte:options accessors />

<script lang="ts">
  import LogViewer from "carbon-components-svelte/LogViewer/LogViewer.svelte";
  import type { ComponentProps } from "svelte";

  export let lines: ComponentProps<LogViewer>["lines"] = [];
  export let maxLines = 10000;
  export let query = "";
  export let regex = false;
  export let levels: ComponentProps<LogViewer>["levels"] = [
    "debug",
    "info",
    "warn",
    "error",
  ];
  export let selection: ComponentProps<LogViewer>["selection"] = null;
  export let follow = true;
  export let wrap = false;

  export let viewer: LogViewer | undefined = undefined;
  let copied = 0;
</script>

<LogViewer
  bind:this={viewer}
  bind:query
  bind:levels
  bind:selection
  bind:follow
  bind:wrap
  {lines}
  {maxLines}
  {regex}
  labelText="Build output"
  on:copy={() => (copied += 1)}
  data-testid="viewer"
/>
<p data-testid="follow">{follow}</p>
<p data-testid="selection">{JSON.stringify(selection)}</p>
<p data-testid="copied">{copied}</p>
