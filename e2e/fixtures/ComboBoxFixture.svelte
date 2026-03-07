<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  function shouldFilterItem(item, value) {
    if (!value) return true;
    return item.text.toLowerCase().includes(value.toLowerCase());
  }
</script>

<ComboBox
  data-testid="combobox-contact"
  labelText="Contact"
  placeholder="Select contact method"
  {items}
  {shouldFilterItem}
/>
