<script>
  import { ComboBox, Button } from "carbon-components-svelte";
  let selectedIndex = 1;
</script>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  bind:selectedIndex
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
/>
<br />
<Button on:click="{() => (selectedIndex = -1)}">Set to -1 (unselected)</Button>
<Button on:click="{() => (selectedIndex = 2)}">Set to 2 (Fax)</Button>
