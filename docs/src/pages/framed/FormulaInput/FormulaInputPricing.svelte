<script>
  import { FormulaInput, Stack } from "carbon-components-svelte";

  const fields = [
    { id: "price", label: "Unit price", type: "number" },
    { id: "quantity", label: "Quantity", type: "number" },
    { id: "status", label: "Order status", type: "string" },
    { id: "discount", label: "Discount", type: "number" },
  ];

  // A sample order to calculate the result against.
  const row = { price: 100, quantity: 3, status: "open", discount: 0.1 };

  let value = 'IF(status = "open", price * 1.2, ROUND(price, 2))';
  let diagnostics = [];
  let result;
</script>

<Stack gap={5}>
  <FormulaInput
    bind:value
    bind:diagnostics
    bind:result
    {fields}
    {row}
    labelText="List price"
    helperText="Type a field or a function, such as ROUND or IF"
  />
  <pre>{JSON.stringify(
      {
        errors: diagnostics.map((d) => d.message),
        result: result?.ok ? result.value : result?.error.message,
      },
      null,
      2,
    )}</pre>
</Stack>
