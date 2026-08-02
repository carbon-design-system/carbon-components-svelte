<script>
  import { MultiSelect } from "carbon-components-svelte";

  const groups = [
    "North America",
    "South America",
    "Europe",
    "Africa",
    "Asia",
    "Oceania",
  ];

  // 6,000 items spread across 6 groups. groupItems buckets them, so each
  // group's items render contiguously under one header.
  const items = Array.from({ length: 6000 }, (_, i) => ({
    id: i,
    text: `City ${i + 1}`,
    group: groups[i % groups.length],
  }));
</script>

<MultiSelect
  labelText="Cities"
  label="Select from 6,000 cities..."
  virtualize
  {items}
/>
