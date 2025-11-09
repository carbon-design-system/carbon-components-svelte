<script>
  import { ComboBox } from "carbon-components-svelte";

  function shouldFilterItem(item, value) {
    if (!value) return true;
    return item.text.toLowerCase().includes(value.toLowerCase());
  }
</script>

<ComboBox
  labelText="Contact"
  placeholder="Select contact method"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ]}
  {shouldFilterItem}
/>
