<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  let comboBox1_selectedIndex = -1;
  let comboBox2_selectedIndex = -1;

  const formatSelected = (i) => (items[i] ? items[i].text : "N/A");

  $: primary = formatSelected(comboBox1_selectedIndex);
  $: secondary = formatSelected(comboBox2_selectedIndex);
</script>

<ComboBox
  bind:selectedIndex="{comboBox1_selectedIndex}"
  titleText="Primary contact"
  placeholder="Select primary contact method"
  items="{items}"
/>

<div>Primary: {primary}</div>

<ComboBox
  bind:selectedIndex="{comboBox2_selectedIndex}"
  titleText="Secondary contact"
  placeholder="Select secondary contact method"
  items="{items}"
/>

<div>Secondary: {secondary}</div>

<style>
  div {
    margin: var(--cds-layout-01) 0 var(--cds-layout-03);
  }
</style>
