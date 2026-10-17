<script>
  import {
    ComboBox,
    NumberInput,
    Select,
    SelectItem,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";

  const label = "Billing contact for overdue invoices";
  const items = [{ id: "a", text: "Alpha" }];
</script>

<!-- Fluid fields too narrow for their labels. -->
<div style="width: 160px; display: grid; gap: 1rem;">
  <button type="button" data-testid="start">Start</button>
  <TextInput fluid labelText={label} />
  <TextArea fluid labelText={label} />
  <Select fluid labelText={label}><SelectItem value="a" text="Alpha" /></Select>
  <NumberInput fluid {label} value={1} />
  <ComboBox fluid labelText={label} {items} />
  <TextInput fluid hideLabel labelText={label} />
</div>
