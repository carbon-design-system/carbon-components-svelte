<script>
  import { MultiSelect, Stack } from "carbon-components-svelte";

  const roles = [
    "Chief Accessibility Officer for Regional Operations and Strategic Partnerships",
    "Deputy Director of Interdepartmental Communications and Outreach",
  ];

  const items = [
    { id: "all", text: "Select every role listed below", isSelectAll: true },
    { id: "0", text: roles[0] },
    { id: "1", text: roles[1] },
    { id: "2", text: "Analyst" },
  ];

  // Past the count at which a list is windowed, so only the options on screen
  // are rendered. `wrapOptions` turns on measured row heights by itself, so
  // offsets follow the heights the wrapped options actually take.
  const manyItems = Array.from({ length: 300 }, (_, i) => ({
    id: String(i),
    text: `${i + 1}. ${roles[i % 2]}`,
  }));

  // Input order, so the "select all" row stays in front of the roles it
  // toggles rather than sorting into the middle of them.
  const sortItem = () => 0;
</script>

<Stack gap={6} style="max-width: 20rem;">
  <MultiSelect
    labelText="Truncated (default)"
    selectedIds={["2"]}
    {sortItem}
    {items}
  />
  <MultiSelect
    wrapOptions
    labelText="Wrapped"
    selectedIds={["2"]}
    {sortItem}
    {items}
  />
  <MultiSelect
    wrapOptions
    filterable
    labelText="Wrapped (windowed, 300 items)"
    placeholder="Filter…"
    {sortItem}
    items={manyItems}
  />
</Stack>
