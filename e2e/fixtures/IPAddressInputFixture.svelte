<script>
  import {
    IPAddressInput,
    IPAddressListInput,
    Stack,
  } from "carbon-components-svelte";

  let subnet = "10.0.0.0/24";
  let ipv6 = "::1";
  let sources = ["203.0.113.0/24", "2001:db8::/32"];
</script>

<Stack gap={7}>
  <div data-testid="cidr">
    <IPAddressInput
      bind:value={subnet}
      labelText="Subnet"
      helperText="Inside 10.0.0.0/16"
      allow={["cidr"]}
      within="10.0.0.0/16"
    />
    <span data-testid="cidr-value">{subnet}</span>
  </div>

  <div data-testid="ipv6">
    <IPAddressInput bind:value={ipv6} labelText="IPv6 address" version={6} />
  </div>

  <div data-testid="invalid">
    <IPAddressInput
      labelText="Invalid address"
      validateOn="input"
      value="10.0.0.256"
    />
  </div>

  <div data-testid="invalid-ipv6">
    <IPAddressInput
      labelText="Invalid IPv6 address"
      validateOn="input"
      value="::1::2"
    />
  </div>

  <div data-testid="warn">
    <IPAddressInput
      labelText="Warning"
      warn
      warnText="Reserved range"
      value="192.0.2.1"
    />
  </div>

  <div data-testid="readonly">
    <IPAddressInput labelText="Read-only" readonly value="::1" />
  </div>

  <div data-testid="disabled">
    <IPAddressInput labelText="Disabled" disabled value="10.0.0.1" />
  </div>

  <div data-testid="list">
    <IPAddressListInput
      bind:value={sources}
      labelText="Sources"
      helperText="Addresses or CIDR blocks"
    />
    <span data-testid="list-value">{JSON.stringify(sources)}</span>
  </div>
</Stack>
