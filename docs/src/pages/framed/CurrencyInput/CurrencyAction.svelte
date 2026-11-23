<script>
  import { numberFormat, Stack, TextInput } from "carbon-components-svelte";

  let text = "";
  let value = "";
</script>

<Stack gap={4}>
  <div
    use:numberFormat={{
      locale: "de-DE",
      currency: "EUR",
      onchange: (detail) => (value = detail.value),
    }}
  >
    <TextInput bind:value={text} labelText="Betrag" />
  </div>

  <div>
    <strong>Text:</strong>
    {JSON.stringify(text)}
  </div>
  <div>
    <strong>Value:</strong>
    {JSON.stringify(value)}
  </div>
</Stack>
