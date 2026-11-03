<script>
  import { Box, PickerGrid } from "carbon-components-svelte";

  // 5,000 hosts in 50 racks.
  const hosts = Array.from({ length: 5000 }, (_, index) => ({
    id: `host-${index}`,
    label: `node-${String(index).padStart(4, "0")}`,
    category: `Rack ${String(Math.floor(index / 100) + 1).padStart(2, "0")}`,
  }));

  let selectedId = "host-2412";
  let rendered = 0;
</script>

<Box maxWidth="28rem">
  <PickerGrid
    items={hosts}
    bind:selectedId
    labelText="Hosts"
    searchLabelText="Search hosts"
    recentLimit={0}
    columns={4}
    cellSize={56}
    on:window:change={({ detail }) => (rendered = detail.items.length)}
  />
</Box>
<p>{hosts.length} hosts, {rendered} of them rendered</p>
