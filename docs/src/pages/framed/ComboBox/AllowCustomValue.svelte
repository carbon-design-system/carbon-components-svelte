<script>
  import { ComboBox, Stack } from "carbon-components-svelte";

  let selectedId = undefined;
  let value = "";
</script>

<Stack gap={2}>
  <ComboBox
    allowCustomValue
      labelText="Favorite fruit"
    placeholder="Select or enter a fruit"
    helperText="You can select from the list or type your own"
    bind:selectedId
    bind:value
    items={[
    { id: "0", text: "Apple" },
    { id: "1", text: "Banana" },
    { id: "2", text: "Orange" },
    { id: "3", text: "Strawberry" },
    ]}
    shouldFilterItem={(item, value) => {
    if (!value) return true;
      return item.text.toLowerCase().includes(value.toLowerCase());
    }}
    on:select={(e) => {
      console.log("Selected item:", e.detail);
    }}
  />
  <div>
    <div><strong>Selected ID:</strong> {selectedId ?? "none"}</div>
    <div><strong>Current value:</strong> {value || "empty"}</div>
  </div>
</Stack>
