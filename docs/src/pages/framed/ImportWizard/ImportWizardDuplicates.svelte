<script>
  import {
    ImportWizard,
    RadioButton,
    RadioButtonGroup,
    Stack,
  } from "carbon-components-svelte";

  // `const` keeps each `type` a literal for the type check.
  const fields = /** @type {const} */ ([
    { key: "sku", label: "SKU", required: true, aliases: ["item number"] },
    { key: "name", label: "Product name", required: true },
    { key: "stock", label: "In stock", type: "integer", min: 0 },
  ]);

  let duplicates = "skip";
</script>

<Stack gap={6}>
  <RadioButtonGroup legendText="Duplicate SKUs" bind:selected={duplicates}>
    <RadioButton labelText="Skip them" value="skip" />
    <RadioButton labelText="Treat them as errors" value="error" />
    <RadioButton labelText="Import them" value="keep" />
  </RadioButtonGroup>
  {#key duplicates}
    <ImportWizard {fields} keyField="sku" {duplicates} />
  {/key}
</Stack>
