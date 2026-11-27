<script>
  import { TransferList } from "carbon-components-svelte";

  const items = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    text: `payments-service-${String(i + 1).padStart(4, "0")}`,
  }));

  let selectedIds = [];
</script>

<TransferList
  {items}
  bind:selectedIds
  filterable
  rows={10}
  legendText="Services to monitor"
  helperText="{selectedIds.length} of {items.length} services selected."
/>
