<script>
  import { CountryPicker, Stack, TextInput } from "carbon-components-svelte";

  // For demo purposes only: a real phone field needs the full table.
  const callingCodes = {
    US: "1",
    CA: "1",
    GB: "44",
    DE: "49",
    FR: "33",
    JP: "81",
  };

  let callingCode = "";
</script>

<Stack gap={5}>
  <CountryPicker
    labelText="Country"
    values={Object.keys(callingCodes)}
    metadata={(code) => callingCodes[code]}
    on:change={(event) => (callingCode = event.detail.metadata ?? "")}
  />
  <TextInput
    labelText="Phone number"
    placeholder="Phone number"
    value={callingCode ? `+${callingCode} ` : ""}
  />
</Stack>
