<script>
  import { Button, ComboBox } from "carbon-components-svelte";

  let selectedId = undefined;
</script>

<ComboBox
  labelText="Department"
  placeholder="Select a department"
  bind:selectedId
  typeahead
  items={[
  {id: "0", text: "Accounting"},
  {id: "1", text: "Accounts Payable"},
  {id: "2", text: "Billing"},
  {id: "3", text: "Business Development"},
  {id: "4", text: "Business Intelligence"},
  {id: "5", text: "Customer Success"},
  {id: "6", text: "Customer Support"},
  {id: "7", text: "Engineering"},
  {id: "8", text: "Marketing"},
  {id: "9", text: "Product"},
  ]}
/>
<br>
<Button
  disabled={selectedId === undefined}
  on:click={() => (selectedId = undefined)}
>
  Set to undefined (unselected)
</Button>
