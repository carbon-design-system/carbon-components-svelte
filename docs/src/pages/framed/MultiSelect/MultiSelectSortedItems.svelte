<script>
  import { MultiSelect } from "carbon-components-svelte";

  let sortedItems = [];
</script>

<MultiSelect
  selectionFeedback="top"
  labelText="Contact"
  label="Select contact methods..."
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ]}
  bind:sortedItems
/>

<pre>{JSON.stringify(sortedItems, null, 2)}</pre>
