<script>
  import {
    FieldRepeater,
    NumberInput,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  let lines = [
    { description: "Architecture review", quantity: 2, price: 150 },
    { description: "Load test", quantity: 1, price: 480 },
  ];

  function lineTotal(line) {
    return (line.quantity || 0) * (line.price || 0);
  }

  $: total = lines.reduce((sum, line) => sum + lineTotal(line), 0);
</script>

<Stack gap={6}>
  <FieldRepeater
    bind:items={lines}
    itemName="line"
    legendText="Line items"
    min={1}
    createItem={() => ({ description: "", quantity: 1, price: 0 })}
    hideItemLabel
    let:index
  >
    <Stack orientation="horizontal" gap={4}>
      <TextInput
        labelText="Description"
        bind:value={lines[index].description}
      />
      <NumberInput
        labelText="Quantity"
        min={1}
        hideSteppers
        bind:value={lines[index].quantity}
      />
      <NumberInput
        labelText="Unit price"
        min={0}
        hideSteppers
        bind:value={lines[index].price}
      />
      <TextInput
        labelText="Amount"
        readonly
        value={money.format(lineTotal(lines[index]))}
      />
    </Stack>
  </FieldRepeater>
  <p>Total: <strong>{money.format(total)}</strong></p>
</Stack>
