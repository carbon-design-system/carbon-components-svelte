<script>
  import { ComboBox } from "carbon-components-svelte";

  let selectedId = undefined;
  let value = "";
</script>

<ComboBox
  allowCustomValue
  titleText="Favorite fruit"
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

<div style="margin-top: 1rem; font-size: 0.875rem;">
  <div><strong>Selected ID:</strong> {selectedId ?? "none"}</div>
  <div><strong>Current value:</strong> {value || "empty"}</div>
</div>
