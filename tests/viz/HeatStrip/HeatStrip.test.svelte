<script lang="ts">
  import HeatStrip from "carbon-components-svelte/viz/HeatStrip/HeatStrip.svelte";

  export let values: Array<number | null> = [0, 5, 10, null, 2];
</script>

<HeatStrip
  {values}
  cellLabels={["Mon", "Tue", "Wed", "Thu", "Fri"]}
  label="Traffic"
  data-testid="basic"
/>
<HeatStrip {values} data-testid="decorative" />
<HeatStrip
  {values}
  min={0}
  max={20}
  hue="teal"
  size="sm"
  format={(v) => `${v}k`}
  translations={{ range: "Bereich" }}
  label="Verkehr"
  data-testid="fixed"
/>
<HeatStrip values={[]} label="Empty" data-testid="empty" />
