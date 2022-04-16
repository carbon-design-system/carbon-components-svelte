<script>
  import { AutoComplete } from "carbon-components-svelte";

  let selectedId = 0;
  let selectedItem = undefined;
</script>

<AutoComplete
  titleText="Contact"
  bind:selectedId
  bind:selectedItem
  placeholder="Placeholder"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '11', text: 'Email1' },
    { id: '12', text: 'Email2' },
    { id: '2', text: 'Fax' },
  ]}"
/>

Selected: {selectedItem?.text} ({selectedId})
