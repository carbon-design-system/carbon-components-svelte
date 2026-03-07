<script>
  import { MultiSelect, Stack } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  let multiselect1_selectedIds = ["0"];
  let multiselect2_selectedIds = ["1", "2"];

  const formatSelected = (i) =>
    i.length === 0
      ? "N/A"
      : i.map((id) => items.find((item) => item.id === id).text).join(", ");

  $: primary = formatSelected(multiselect1_selectedIds);
  $: secondary = formatSelected(multiselect2_selectedIds);
</script>

<Stack gap={6}>
  <MultiSelect
    labelText="Primary contact"
    helperText="Primary: {primary}"
    bind:selectedIds={multiselect1_selectedIds}
    label="Select contact methods..."
    {items}
  />
  <MultiSelect
    labelText="Secondary contact"
    helperText="Secondary: {secondary}"
    bind:selectedIds={multiselect2_selectedIds}
    label="Select contact methods..."
    {items}
  />
</Stack>
