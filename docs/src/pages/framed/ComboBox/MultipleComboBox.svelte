<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  let comboBox1_selectedId = undefined;
  let comboBox2_selectedId = undefined;

  const formatSelected = (id) =>
    items.find((item) => item.id === id)?.text ?? "N/A";

  $: primary = formatSelected(comboBox1_selectedId);
  $: secondary = formatSelected(comboBox2_selectedId);
</script>

<ComboBox
  bind:selectedId={comboBox1_selectedId}
  labelText="Primary contact"
  placeholder="Select primary contact method"
  {items}
/>

<div>Primary: {primary}</div>

<ComboBox
  bind:selectedId={comboBox2_selectedId}
  labelText="Secondary contact"
  placeholder="Select secondary contact method"
  {items}
/>

<div>Secondary: {secondary}</div>

<style>
  div {
    margin: var(--cds-layout-01) 0 var(--cds-layout-03);
  }
</style>
