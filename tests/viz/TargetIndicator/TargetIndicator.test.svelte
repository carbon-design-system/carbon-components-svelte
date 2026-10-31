<script lang="ts">
  import TargetIndicator from "carbon-components-svelte/viz/TargetIndicator/TargetIndicator.svelte";

  export let value: number | null = 84;
  export let expected: number | null | undefined = 78;
</script>

<TargetIndicator
  {value}
  target={100}
  {expected}
  label="Quota attainment"
  showValue
  data-testid="basic"
/>
<TargetIndicator value={40} target={100} data-testid="decorative" />
<TargetIndicator
  value={120}
  target={100}
  expected={90}
  label="Over"
  translations={{ met: "erreicht", of: "von" }}
  data-testid="over"
/>
