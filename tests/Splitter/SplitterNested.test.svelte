<script lang="ts">
  import Splitter from "carbon-components-svelte/Splitter/Splitter.svelte";
  import type { ComponentProps } from "svelte";

  export let outerDelayMs: ComponentProps<Splitter>["enterDelayMs"] = undefined;
  export let innerDelayMs: ComponentProps<Splitter>["enterDelayMs"] = undefined;
</script>

<Splitter enterDelayMs={outerDelayMs} separatorLabel="Outer">
  <div slot="start">Start pane</div>
  <Splitter
    slot="end"
    orientation="vertical"
    enterDelayMs={innerDelayMs}
    separatorLabel="Inner"
  >
    <div slot="start">Top pane</div>
    <div slot="end">Bottom pane</div>
  </Splitter>
</Splitter>
