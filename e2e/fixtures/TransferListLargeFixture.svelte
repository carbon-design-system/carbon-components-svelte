<script>
  import { TransferList } from "carbon-components-svelte";

  const items = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    text: `Service ${String(i + 1).padStart(4, "0")}`,
  }));

  let selectedIds = [];
</script>

<TransferList
  {items}
  bind:selectedIds
  filterable
  name="services"
  rows={10}
  legendText="Services to monitor"
/>
<p data-testid="count">{selectedIds.length}</p>
