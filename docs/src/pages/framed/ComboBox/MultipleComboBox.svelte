<script>
  import { ComboBox, Stack } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Webhook" },
  ];

  let comboBox1_selectedId = undefined;
  let comboBox2_selectedId = undefined;

  const formatSelected = (id) =>
    items.find((item) => item.id === id)?.text ?? "N/A";

  $: primary = formatSelected(comboBox1_selectedId);
  $: secondary = formatSelected(comboBox2_selectedId);
</script>

<Stack gap={4}>
  <ComboBox
    bind:selectedId={comboBox1_selectedId}
    labelText="Primary alert channel"
    placeholder="Select primary alert channel"
    {items}
  />
  <div>Primary: {primary}</div>
  <ComboBox
    bind:selectedId={comboBox2_selectedId}
    labelText="Secondary alert channel"
    placeholder="Select secondary alert channel"
    {items}
  />
  <div>Secondary: {secondary}</div>
</Stack>
