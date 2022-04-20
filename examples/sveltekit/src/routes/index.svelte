<script>
  import { Button, truncate, breakpoints } from "carbon-components-svelte";
  import { Airplane } from "carbon-pictograms-svelte";

  import { AutoComplete } from "carbon-components-svelte";

  let selectedId = 0;
    let selectedItem = undefined;
</script>

<Button>Primary button</Button>

<Airplane />

<div use:truncate>Text...</div>

{JSON.stringify(breakpoints)}

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
