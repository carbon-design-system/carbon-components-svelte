<script>
  import { IPAddressListInput, Stack } from "carbon-components-svelte";

  let value = ["203.0.113.0/24", "198.51.100.7"];
  let parsed = [];

  $: total = parsed.reduce((sum, entry) => sum + entry.size, BigInt(0));
</script>

<Stack gap={5}>
  <IPAddressListInput
    bind:value
    bind:parsed
    labelText="Allowed sources"
    helperText="Paste a list of addresses or CIDR blocks, one per line or separated by commas"
    placeholder="203.0.113.0/24"
    version={4}
    excludes="10.0.0.0/8"
    max={50}
  />
  <p>{value.length} entries, {total.toLocaleString("en")} addresses</p>
</Stack>
