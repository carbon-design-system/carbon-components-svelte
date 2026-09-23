<script lang="ts">
  import SegmentedProgress from "carbon-components-svelte/viz/SegmentedProgress/SegmentedProgress.svelte";

  export let value = 4;
  export let max = 8;
  export let status:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    | undefined = undefined;
</script>

<SegmentedProgress
  {value}
  {max}
  {status}
  label="Onboarding"
  showValue
  data-testid="basic"
/>
<SegmentedProgress value={2.5} max={4} data-testid="partial" />
<SegmentedProgress
  value={9}
  max={3}
  label="Over"
  translations={{ of: "von" }}
  data-testid="clamped"
/>
