<script>
  import {
    Button,
    createSettings,
    SettingRow,
    SettingsPage,
    SettingsSaveBar,
    SettingsSection,
    Stack,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";

  const settings = createSettings(
    {
      webhookUrl: "https://hooks.acme.example/deploys",
      deployAlerts: true,
      auditExport: true,
      branchProtection: true,
    },
    { defaults: { webhookUrl: "", deployAlerts: false } },
  );
  const { values } = settings;

  function rejectWebhook() {
    settings.setErrors({
      webhookUrl: "That address didn't answer a test ping.",
    });
  }
</script>

<SettingsPage {settings}>
  <Stack gap={5}>
    <SettingsSection
      id="integrations"
      title="Integrations"
      description="Where deployments report to."
    >
      <SettingRow
        name="webhookUrl"
        label="Webhook URL"
        description="Receives a POST for every deployment."
        let:controlProps
        let:invalid
        let:invalidText
      >
        <TextInput
          {...controlProps}
          {invalid}
          {invalidText}
          bind:value={$values.webhookUrl}
        />
      </SettingRow>
      <SettingRow
        name="deployAlerts"
        label="Deployment alerts"
        description="Message the channel when a deployment fails."
        let:controlProps
      >
        <Toggle {...controlProps} bind:toggled={$values.deployAlerts} />
      </SettingRow>
      <SettingRow
        name="auditExport"
        label="Export the audit log"
        description="Set by your organization's compliance policy."
        locked
        let:controlProps
      >
        <Toggle {...controlProps} bind:toggled={$values.auditExport} />
      </SettingRow>
    </SettingsSection>
    <Button kind="tertiary" size="sm" on:click={rejectWebhook}>
      Reject the webhook URL
    </Button>
    <SettingsSaveBar />
  </Stack>
</SettingsPage>
