<svelte:options accessors />

<script lang="ts">
  import Countdown from "carbon-components-svelte/Countdown/Countdown.svelte";
  import type { ComponentProps } from "svelte";

  export let seconds = 90;
  export let remaining = seconds;
  export let running = true;
  export let format: ComponentProps<Countdown>["format"] = "auto";
  export let withSlot = false;
  export let ends = 0;
</script>

{#if withSlot}
  <Countdown
    {seconds}
    bind:remaining
    bind:running
    {format}
    on:end={() => (ends += 1)}
    let:formatted
    let:fraction
  >
    <span data-testid="custom">{formatted} {fraction.toFixed(2)}</span>
  </Countdown>
{:else}
  <Countdown
    {seconds}
    bind:remaining
    bind:running
    {format}
    on:end={() => (ends += 1)}
  />
{/if}
