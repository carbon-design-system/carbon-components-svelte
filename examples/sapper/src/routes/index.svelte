<script>
  import { AutoComplete, Button } from "carbon-components-svelte";
</script>

<AutoComplete
  titleText="Contact"
  selectedId="0"
  items="{[
    { id: '0', text: 'Slack' },
    { id: '11', text: 'Email1' },
    { id: '12', text: 'Email2' },
    { id: '2', text: 'Fax' },
  ]}"
/>

<Button>Primary button</Button>
