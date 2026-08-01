<script>
  import { ComboBox, Stack } from "carbon-components-svelte";

  let items = [
    { id: "0", text: "Apple" },
    { id: "1", text: "Banana" },
    { id: "2", text: "Orange" },
    { id: "3", text: "Strawberry" },
  ];
  let selectedId = undefined;
  let value = "";
</script>

<Stack gap={2}>
  <ComboBox
    allowCustomValue
    labelText="Favorite fruit"
    placeholder="Select or create a fruit"
    helperText="Type a new name and choose Create to add it to the list"
    bind:selectedId
    bind:value
    {items}
    shouldFilterItem={(item, query) => {
      if (!query) return true;
      return item.text.toLowerCase().includes(query.toLowerCase());
    }}
    on:create={(e) => {
      const text = e.detail;
      items = [...items, { id: text, text }];
      value = text;
      selectedId = text;
    }}
  />
  <div>
    <div><strong>Selected ID:</strong> {selectedId ?? "none"}</div>
    <div><strong>Current value:</strong> {value || "empty"}</div>
    <div>
      <strong>Items:</strong> {items.map((item) => item.text).join(", ")}
    </div>
  </div>
</Stack>
