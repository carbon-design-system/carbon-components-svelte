<script lang="ts">
  import BigNumber from "carbon-components-svelte/BigNumber/BigNumber.svelte";
</script>

<BigNumber labelText="Basic" value={42} data-testid="basic" />

<BigNumber labelText="No total" value={42} data-testid="no-total" />
<BigNumber
  labelText="Total shown"
  value={3}
  total={10}
  data-testid="total-shown"
/>
<BigNumber
  labelText="Total equal to value"
  value={999}
  total={999}
  data-testid="total-equal"
/>
<BigNumber
  labelText="Total less than value"
  value={10}
  total={3}
  data-testid="total-less"
/>
<BigNumber
  labelText="Total truncates the same as value"
  value={1000000}
  total={1040000}
  data-testid="total-truncated-same"
/>
<BigNumber
  labelText="Force show total"
  value={999}
  total={999}
  forceShowTotal
  data-testid="force-show-total"
/>

<BigNumber
  labelText="Percentage"
  value={42}
  percentage
  data-testid="percentage"
/>
<BigNumber
  labelText="Percentage hides total"
  value={3}
  total={10}
  percentage
  data-testid="percentage-with-total"
/>

<BigNumber
  labelText="Truncate thousands"
  value={1500}
  data-testid="truncate-thousands"
/>
<BigNumber
  labelText="Truncate millions"
  value={2500000}
  data-testid="truncate-millions"
/>
<BigNumber
  labelText="Full number"
  value={1500}
  fullNumber
  data-testid="full-number"
/>

<BigNumber labelText="Trend up" value={42} trend="up" data-testid="trend-up" />
<BigNumber
  labelText="Trend down"
  value={42}
  trend="down"
  data-testid="trend-down"
/>
<BigNumber labelText="No trend" value={42} data-testid="no-trend" />
<BigNumber
  labelText="Trend up, overridden to error"
  value={42}
  trend="up"
  trendColor="error"
  data-testid="trend-up-error"
/>
<BigNumber
  labelText="Trend down, overridden to success"
  value={42}
  trend="down"
  trendColor="success"
  data-testid="trend-down-success"
/>

<BigNumber labelText="Loading" value={42} loading data-testid="loading" />

<BigNumber
  labelText="Tooltip"
  value={42}
  tooltipDescription="Extra context about this metric"
  data-testid="tooltip"
/>

<BigNumber
  labelText="Default label"
  value={42}
  data-testid="label-children-test"
>
  <strong slot="labelChildren">Custom label content</strong>
</BigNumber>
