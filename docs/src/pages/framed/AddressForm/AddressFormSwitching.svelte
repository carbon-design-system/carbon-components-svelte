<script>
  import { AddressForm, Stack } from "carbon-components-svelte";

  let value = {
    country: "US",
    lines: ["350 Fifth Avenue", "Floor 21"],
    locality: "New York",
    region: "NY",
    postalCode: "10118",
  };
  let last = "";
</script>

<Stack gap={6}>
  <AddressForm
    bind:value
    legendText="Delivery address"
    on:countrychange={({ detail }) => {
      last = `${detail.from} to ${detail.to}, cleared: ${detail.cleared.join(", ") || "nothing"}`;
    }}
  />
  <div>Last change: {last || "none yet"}</div>
</Stack>
