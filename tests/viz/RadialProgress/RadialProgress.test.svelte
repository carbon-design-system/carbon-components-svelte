<script lang="ts">
  import RadialProgress from "carbon-components-svelte/viz/RadialProgress/RadialProgress.svelte";

  export let value = 72;
  export let onthreshold: (detail: unknown) => void = () => {};
  const thresholds = [
    { value: 80, kind: "warning" as const },
    { value: 95, kind: "error" as const },
  ];
</script>

<RadialProgress
  {value}
  {thresholds}
  label="Disk usage"
  data-testid="basic"
  on:threshold={(e) => onthreshold(e.detail)}
/>
<RadialProgress {value} data-testid="decorative" />
<RadialProgress
  value={30}
  min={20}
  max={40}
  arc="half"
  diameter={120}
  thickness={10}
  color="success"
  format={(v) => `${v} GB`}
  label="Storage"
  data-testid="half"
/>
<RadialProgress
  {value}
  arc="three-quarter"
  hideValue
  label="Bare"
  data-testid="bare"
/>
<RadialProgress
  {value}
  label="Slotted"
  data-testid="slotted"
  let:formattedValue
  let:status
>
  <strong>{formattedValue} {status}</strong>
</RadialProgress>
<RadialProgress value={0} label="Empty" data-testid="empty" />
