<script lang="ts">
  import TimeRangePicker from "carbon-components-svelte/viz/TimeRangePicker/TimeRangePicker.svelte";
  import { createTimeRange } from "carbon-components-svelte/viz/utils/time-range.js";

  export let custom = true;
  export let onchange: (detail: unknown) => void = () => {};
  const NOW = Date.UTC(2026, 9, 24, 9, 41);
  export const range = createTimeRange({
    presets: ["24h", "7d"],
    initial: "7d",
    now: () => NOW,
  });
</script>

<TimeRangePicker
  {range}
  {custom}
  locale="en"
  on:change={(e) => onchange(e.detail)}
/>
<output data-testid="range"
  >{$range.preset ??
    `${$range.from.toISOString()}..${$range.to.toISOString()}`}</output
>
