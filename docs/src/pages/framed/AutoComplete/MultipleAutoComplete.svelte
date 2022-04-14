<script>
  import { AutoComplete } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  let auto_complete1_selectedId = "0";
  let auto_complete2_selectedId = "1";

  const formatSelected = (id) =>
    items.find((item) => item.id === id)?.text ?? "N/A";

  $: primary = formatSelected(auto_complete1_selectedId);
  $: secondary = formatSelected(auto_complete2_selectedId);
</script>

<AutoComplete
  titleText="Primary contact"
  bind:selectedId="{auto_complete1_selectedId}"
  items="{items}"
/>

<div>Primary: {primary}</div>

<AutoComplete
  invalid="{auto_complete1_selectedId === auto_complete2_selectedId}"
  invalidText="Secondary contact method must be different from the primary contact"
  titleText="Secondary contact"
  bind:selectedId="{auto_complete2_selectedId}"
  items="{items}"
/>

<div>Secondary: {secondary}</div>

<style>
  div {
    margin: var(--cds-layout-01) 0 var(--cds-layout-03);
  }
</style>
