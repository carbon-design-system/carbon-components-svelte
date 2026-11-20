<script>
  import { IPAddressInput, Stack } from "carbon-components-svelte";

  let value = "2001:0DB8:0000:0000:0000:0000:0000:0001";
  let parsed = null;
</script>

<Stack gap={5}>
  <IPAddressInput
    bind:value
    bind:parsed
    labelText="Instance address"
    helperText="Press Enter or leave the field to rewrite it in its shortest form"
    version={6}
    allow={["address", "cidr"]}
    hostBits="allow"
  />
  {#if parsed}
    <p>
      IPv{parsed.version}
      {parsed.kind}, canonical text
      <code>{parsed.text}</code>
    </p>
  {/if}
</Stack>
