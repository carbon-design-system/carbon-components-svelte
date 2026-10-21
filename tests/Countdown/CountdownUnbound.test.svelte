<svelte:options accessors />

<script lang="ts">
  import Countdown from "carbon-components-svelte/Countdown/Countdown.svelte";
  import type { ComponentProps } from "svelte";

  export let seconds = 60;
  export let until: ComponentProps<Countdown>["until"] = undefined;
  export let running = true;
  export let ends = 0;
</script>

<!-- `remaining` is not bound, so `until` sets the starting time. -->
<Countdown {seconds} {until} bind:running on:end={() => (ends += 1)} />
