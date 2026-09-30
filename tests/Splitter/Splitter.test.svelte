<script lang="ts">
  import Splitter from "carbon-components-svelte/Splitter/Splitter.svelte";
  import type { ComponentProps } from "svelte";

  export let size = 50;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let orientation: ComponentProps<Splitter>["orientation"] =
    "horizontal";
  export let disabled = false;
  export let separatorLabel: ComponentProps<Splitter>["separatorLabel"] =
    undefined;
</script>

<Splitter
  bind:size
  {min}
  {max}
  {step}
  {orientation}
  {disabled}
  separatorLabel={separatorLabel ?? "Resize panes"}
  data-testid="splitter"
  on:resize={(e) => console.log("resize", e.detail)}
>
  <div slot="start">Start pane</div>
  <div slot="end">End pane</div>
</Splitter>
<div data-testid="bound-size">{size}</div>
