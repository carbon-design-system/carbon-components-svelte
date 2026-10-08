<script>
  import { Dropdown } from "carbon-components-svelte";

  let items = [];
  let loading = false;

  // Simulate fetching the items the first time the menu opens.
  async function handleOpen() {
    if (items.length > 0 || loading) return;
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 300));
    items = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email" },
      { id: "2", text: "Fax" },
    ];
    loading = false;
  }
</script>

<Dropdown
  labelText="Contact"
  label="Select a contact method"
  {items}
  {loading}
  on:open={handleOpen}
/>
