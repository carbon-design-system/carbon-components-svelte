<script>
  import { FormulaInput, Stack } from "carbon-components-svelte";

  const fields = [
    { id: "revenue", label: "הכנסות", type: "number" },
    { id: "cost", label: "עלות", type: "number" },
    { id: "units", label: "Units sold", type: "number" },
  ];

  let value = "({הכנסות} - {עלות}) / {Units sold}";
</script>

<Stack gap={5}>
  <FormulaInput
    bind:value
    {fields}
    refBy="label"
    row={{ revenue: 52000, cost: 31500, units: 410 }}
    labelText="Margin per unit"
    helperText="Field labels may be in any script. The formula still reads left to right"
  />
</Stack>
