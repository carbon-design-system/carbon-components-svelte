<script lang="ts">
  import ImageCompare from "carbon-components-svelte/ImageCompare/ImageCompare.svelte";
  import type { ComponentProps } from "svelte";

  export let value = 50;
  export let selected: ComponentProps<ImageCompare>["selected"] = "before";
  export let mode: ComponentProps<ImageCompare>["mode"] = "slider";
  export let orientation: ComponentProps<ImageCompare>["orientation"] =
    "horizontal";
  export let slots = false;
  export let onChange: (detail: number) => void = () => {};
</script>

<p data-testid="bound-value">{value}</p>
<p data-testid="bound-selected">{selected}</p>

{#if slots}
  <ImageCompare
    bind:value
    bind:selected
    {mode}
    {orientation}
    on:change={(e) => onChange(e.detail)}
  >
    <p slot="before" data-testid="before-slot">Q1 revenue</p>
    <p slot="after" data-testid="after-slot">Q2 revenue</p>
  </ImageCompare>
{:else}
  <ImageCompare
    bind:value
    bind:selected
    {mode}
    {orientation}
    beforeSrc="before.png"
    afterSrc="after.png"
    on:change={(e) => onChange(e.detail)}
  />
{/if}
