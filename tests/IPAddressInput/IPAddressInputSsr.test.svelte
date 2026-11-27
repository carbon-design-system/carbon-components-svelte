<script lang="ts">
  import IPAddressInput from "carbon-components-svelte/IPAddressInput/IPAddressInput.svelte";
  import IPAddressListInput from "carbon-components-svelte/IPAddressInput/IPAddressListInput.svelte";
</script>

<IPAddressInput
  id="subnet"
  labelText="Subnet"
  allow={["cidr"]}
  value="10.0.0.0/24"
/>
<IPAddressInput
  id="bad"
  labelText="Bad"
  validateOn="input"
  value="10.0.0.256"
/>
<IPAddressListInput
  id="sources"
  labelText="Sources"
  name="sources"
  value={["10.0.0.0/24", "::1/128"]}
/>
