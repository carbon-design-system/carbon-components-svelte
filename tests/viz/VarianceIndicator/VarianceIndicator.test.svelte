<script lang="ts">
  import VarianceIndicator from "carbon-components-svelte/viz/VarianceIndicator/VarianceIndicator.svelte";
</script>

<VarianceIndicator
  value={-12000}
  max={30000}
  label="Revenue against plan"
  data-testid="under"
/>
<VarianceIndicator
  value={18000}
  max={30000}
  label="Revenue against plan"
  data-testid="over"
/>
<VarianceIndicator
  value={18000}
  max={30000}
  positive="down"
  data-testid="cost"
/>
<VarianceIndicator value={0} max={30000} label="On plan" data-testid="zero" />
<VarianceIndicator value={null} label="Missing" data-testid="missing" />
<VarianceIndicator
  value={-250}
  format={(v) => `${v} ms`}
  size="sm"
  data-testid="custom"
/>
<VarianceIndicator
  value={45000}
  max={30000}
  showValue={false}
  data-testid="clamped"
/>
