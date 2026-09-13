<script>
  import { ComboBox } from "carbon-components-svelte";

  function shouldFilterItem(item, value) {
    if (!value) return true;
    return item.text.toLowerCase().includes(value.toLowerCase());
  }
</script>

<ComboBox
  labelText="Alert channel"
  placeholder="Select alert channel"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Webhook" },
  ]}
  {shouldFilterItem}
  clearFilterOnOpen
  selectedId="1"
  helperText="Select an item, then reopen to see all items again"
/>
