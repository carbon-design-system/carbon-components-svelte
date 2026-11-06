<script>
  import { Box, NumberRangeInput, Stack, Tag } from "carbon-components-svelte";

  let price = [25, null];
  let valid = true;

  // What a results query would take: only a valid range applies.
  $: terms = [
    price[0] === null ? "" : `price >= ${price[0]}`,
    price[1] === null ? "" : `price <= ${price[1]}`,
  ].filter(Boolean);
  $: query =
    valid && terms.length > 0 ? terms.join(" and ") : "no price filter";
</script>

<Box width="18rem" padding={5}>
  <Stack gap={5}>
    <NumberRangeInput
      labelText="Price"
      slider
      min={0}
      max={500}
      step={5}
      locale="en-US"
      formatOptions={{
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }}
      bind:value={price}
      bind:valid
    />
    <Tag type={valid ? "blue" : "gray"}>{query}</Tag>
  </Stack>
</Box>
