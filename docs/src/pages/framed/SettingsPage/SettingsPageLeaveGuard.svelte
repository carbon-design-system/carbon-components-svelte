<script>
  import {
    Button,
    createSettings,
    Link,
    SettingRow,
    SettingsPage,
    SettingsSaveBar,
    SettingsSection,
    Stack,
    Text,
    TextInput,
  } from "carbon-components-svelte";

  const settings = createSettings({ ownerEmail: "ops@acme.example" });
  const { values } = settings;

  let route = "settings";

  // A router hook cancels the navigation, asks, and goes on once the user
  // discards. `interrupt` returns false when the page is clean.
  function navigate(to) {
    const interrupted = settings.unsaved.interrupt(
      () => {},
      () => (route = to),
    );
    if (!interrupted) route = to;
  }
</script>

<Stack gap={5}>
  <Stack gap={5} orientation="horizontal" align="center">
    <Link
      href="#settings"
      on:click={(event) => {
        event.preventDefault();
        navigate("settings");
      }}
    >
      Settings
    </Link>
    <Link
      href="#billing"
      on:click={(event) => {
        event.preventDefault();
        navigate("billing");
      }}
    >
      Billing
    </Link>
  </Stack>
  {#if route === "settings"}
    <SettingsPage {settings}>
      <Stack gap={5}>
        <SettingsSection id="contact" title="Contact">
          <SettingRow
            name="ownerEmail"
            label="Owner email"
            description="Receives billing and security notices."
            let:controlProps
          >
            <TextInput {...controlProps} bind:value={$values.ownerEmail} />
          </SettingRow>
        </SettingsSection>
        <SettingsSaveBar />
      </Stack>
    </SettingsPage>
  {:else}
    <Stack gap={3}>
      <Text>You are on the billing page.</Text>
      <Button kind="tertiary" size="sm" on:click={() => (route = "settings")}>
        Back to settings
      </Button>
    </Stack>
  {/if}
</Stack>
