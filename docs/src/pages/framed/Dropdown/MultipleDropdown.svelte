<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  let dropdown1_selectedId = "0";
  let dropdown2_selectedId = "1";

  const formatSelected = (id) =>
    items.find((item) => item.id === id)?.text ?? "N/A";

  $: primary = formatSelected(dropdown1_selectedId);
  $: secondary = formatSelected(dropdown2_selectedId);
</script>

<Dropdown
  labelText="Primary contact"
  bind:selectedId={dropdown1_selectedId}
  {items}
/>

<div>Primary: {primary}</div>

<Dropdown
  invalid={dropdown1_selectedId === dropdown2_selectedId}
  invalidText="Secondary contact method must be different from the primary contact"
  labelText="Secondary contact"
  bind:selectedId={dropdown2_selectedId}
  {items}
/>

<div>Secondary: {secondary}</div>

<style>
  div {
    margin: var(--cds-layout-01) 0 var(--cds-layout-03);
  }
</style>
