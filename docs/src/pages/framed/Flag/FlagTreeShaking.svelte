<script>
  import { Flag, Stack, Text } from "carbon-components-svelte";
  // Import the flags you draw. A bundler leaves the other flags out.
  import { DE, FR, JP } from "carbon-components-svelte/flags";
  // Import `flags/all` to look one up by code. It holds every flag, so load it
  // on demand: the code is only fetched when a user needs a flag.
  let flag;
  async function lookUp(code) {
    const { getFlag } = await import("carbon-components-svelte/flags/all");
    flag = getFlag(code);
  }
  lookUp("KE");
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={4} align="center">
    <Flag flag={JP} size={32} title="Japan" />
    <Flag flag={FR} size={32} title="France" />
    <Flag flag={DE} size={32} title="Germany" />
  </Stack>
  <Stack orientation="horizontal" gap={4} align="center">
    <Flag {flag} code="KE" size={32} title="Kenya" />
    <Text>Loaded on demand</Text>
  </Stack>
</Stack>
