<script lang="ts">
  import Splitter from "carbon-components-svelte/Splitter/Splitter.svelte";
  import type { ComponentProps } from "svelte";

  export let size = 50;
  export let collapsed = false;
  export let min: ComponentProps<Splitter>["min"] = 0;
  export let max: ComponentProps<Splitter>["max"] = 100;
  export let step = 1;
  export let orientation: ComponentProps<Splitter>["orientation"] =
    "horizontal";
  export let disabled = false;
  export let separatorLabel: ComponentProps<Splitter>["separatorLabel"] =
    undefined;
  export let enterDelayMs: ComponentProps<Splitter>["enterDelayMs"] = undefined;
  export let onResize: (detail: { size: number }) => void = () => {};
</script>

<Splitter
  bind:size
  bind:collapsed
  {min}
  {max}
  {step}
  {orientation}
  {disabled}
  {enterDelayMs}
  {separatorLabel}
  data-testid="splitter"
  on:resize={(e) => onResize(e.detail)}
>
  <div slot="start">Start pane <a href="#start">Start link</a></div>
  <div slot="end">End pane <a href="#end">End link</a></div>
</Splitter>
<div data-testid="bound-size">{size}</div>
<div data-testid="bound-collapsed">{collapsed}</div>
<button type="button" on:click={() => (collapsed = !collapsed)}>
  Toggle collapsed
</button>
