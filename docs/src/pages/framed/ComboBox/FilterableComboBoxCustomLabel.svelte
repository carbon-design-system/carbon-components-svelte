<script>
  import { ComboBox } from "carbon-components-svelte";

  const translation = {
    Slack: 'Custom label for "Slack"',
    Email: 'Custom label for "Email"',
    Webhook: 'Custom label for "Webhook"',
  };

  function itemToString(item) {
    return translation[item.text];
  }

  function shouldFilterItem(item, value) {
    if (!value) return true;
    const comparison = value.toLowerCase();
    return (
      item.text.toLowerCase().includes(comparison) ||
      itemToString(item).toLowerCase().includes(comparison)
    );
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
  {itemToString}
/>
