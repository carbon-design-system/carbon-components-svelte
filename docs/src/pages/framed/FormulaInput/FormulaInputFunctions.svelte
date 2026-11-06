<script>
  import {
    defaultFunctions,
    FormulaInput,
    Stack,
  } from "carbon-components-svelte";

  const functions = [
    ...defaultFunctions,
    {
      name: "TAX",
      description: "The sales tax on an amount for a region.",
      params: [
        { name: "amount", type: "number", description: "The pre-tax amount." },
        { name: "region", type: "string", description: 'A code such as "NY".' },
      ],
      returns: "number",
      evaluate: ([amount, region]) => {
        const rates = { NY: 0.08875, CA: 0.0725, TX: 0.0625 };
        return Number(amount) * (rates[String(region)] ?? 0);
      },
    },
  ];

  const fields = [
    { id: "subtotal", label: "Subtotal", type: "number" },
    { id: "state", label: "Ship-to state", type: "string" },
  ];

  let value = "ROUND(subtotal + TAX(subtotal, state), 2)";
</script>

<Stack gap={5}>
  <FormulaInput
    bind:value
    {functions}
    {fields}
    row={{ subtotal: 249.99, state: "NY" }}
    labelText="Order total"
    helperText="TAX is a function this page adds to the built-in set"
  />
</Stack>
