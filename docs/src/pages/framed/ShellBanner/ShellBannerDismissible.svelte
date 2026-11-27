<script>
  import {
    Button,
    Content,
    Header,
    ShellBanner,
    SkipToContent,
    Stack,
  } from "carbon-components-svelte";

  const dismissId = "release-2-0";
</script>

<Header companyName="Acme" platformName="Admin">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
</Header>

<ShellBanner
  placement="above-header"
  dismissible
  {dismissId}
  kind="info"
  title="Version 2.0 is out."
  subtitle="Reload to get the new reports."
/>

<Content>
  <Stack gap={5}>
    <h1>Dismissal is remembered</h1>
    <p>
      Close the banner and reload the page. It stays closed until the
      <code>dismissId</code> changes.
    </p>
    <Button
      kind="tertiary"
      on:click={() => {
        localStorage.removeItem(`ccs-shell-banner:${dismissId}`);
        location.reload();
      }}
    >
      Forget dismissal
    </Button>
  </Stack>
</Content>
