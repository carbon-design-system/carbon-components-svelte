<script>
  import { ComboBox, Stack } from "carbon-components-svelte";

  let selectedId = undefined;
  let value = "";
</script>

<Stack gap={2}>
  <ComboBox
    allowCustomValue
    labelText="Deployment region"
    placeholder="Select or enter a region"
    helperText="Select a common region or enter a custom one"
    bind:selectedId
    bind:value
    items={[
    { id: "0", text: "us-east-1" },
    { id: "1", text: "us-west-2" },
    { id: "2", text: "eu-west-1" },
    { id: "3", text: "ap-southeast-1" },
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
