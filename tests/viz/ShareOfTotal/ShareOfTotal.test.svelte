<script lang="ts">
  import ShareOfTotal from "carbon-components-svelte/viz/ShareOfTotal/ShareOfTotal.svelte";

  export let value = 380;
</script>

<ShareOfTotal
  {value}
  total={1000}
  label="Enterprise share"
  data-testid="basic"
/>
<ShareOfTotal {value} total={1000} data-testid="decorative" />
<ShareOfTotal
  value={1}
  total={3}
  suffix=""
  fractionDigits={1}
  color="success"
  size="sm"
  label="Done"
  data-testid="precise"
/>
<ShareOfTotal
  value={5}
  total={1000}
  hideValue
  color={3}
  label="Bare"
  data-testid="bare"
/>
<ShareOfTotal value={50} total={0} label="No total" data-testid="empty" />
<ShareOfTotal value={500} total={100} label="Over" data-testid="over" />
