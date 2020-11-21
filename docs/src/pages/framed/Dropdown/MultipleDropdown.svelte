<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  let dropdown1_selectedIndex = 0;
  let dropdown2_selectedIndex = 1;

  const formatSelected = (i) => (items[i] ? items[i].text : "N/A");

  $: primary = formatSelected(dropdown1_selectedIndex);
  $: secondary = formatSelected(dropdown2_selectedIndex);
</script>

<style>
  div {
    margin: var(--cds-layout-01) 0 var(--cds-layout-03);
  }
</style>

<Dropdown
  titleText="Primary contact"
  bind:selectedIndex="{dropdown1_selectedIndex}"
  items="{items}"
/>

<div>Primary: {primary}</div>

<Dropdown
  invalid="{dropdown1_selectedIndex === dropdown2_selectedIndex}"
  invalidText="Secondary contact method must be different from the primary contact"
  titleText="Secondary contact"
  bind:selectedIndex="{dropdown2_selectedIndex}"
  items="{items}"
/>

<div>Secondary: {secondary}</div>
