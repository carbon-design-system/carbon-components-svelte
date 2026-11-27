<script>
  import {
    createSettings,
    InlineNotification,
    RadioButton,
    RadioButtonGroup,
    SettingRow,
    SettingsPage,
    SettingsSaveBar,
    SettingsSection,
    Stack,
    Toggle,
  } from "carbon-components-svelte";

  const settings = createSettings(
    { autoScale: true, spotInstances: false },
    { optimistic: true },
  );
  const { values } = settings;

  let server = "ok";
  let failure = "";

  async function save() {
    // For demo purposes only: a real page would call its API here.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    if (server === "down") throw new Error("Service unavailable");
  }

  function handleSave(event) {
    failure = event.detail.ok
      ? ""
      : "The server didn't answer, so the settings went back. Your edits are still here.";
  }
</script>

<SettingsPage {settings} {save} on:save={handleSave}>
  <Stack gap={5}>
    <RadioButtonGroup legendText="The server" bind:selected={server}>
      <RadioButton value="ok" labelText="Answers" />
      <RadioButton value="down" labelText="Is down" />
    </RadioButtonGroup>
    {#if failure}
      <InlineNotification
        kind="error"
        lowContrast
        title="Not saved"
        subtitle={failure}
        on:close={() => (failure = "")}
      />
    {/if}
    <SettingsSection id="scaling" title="Scaling">
      <SettingRow
        name="autoScale"
        label="Autoscaling"
        description="Add nodes when the queue grows."
        let:controlProps
      >
        <Toggle {...controlProps} bind:toggled={$values.autoScale} />
      </SettingRow>
      <SettingRow
        name="spotInstances"
        label="Spot instances"
        description="Run batch jobs on spare capacity."
        let:controlProps
      >
        <Toggle {...controlProps} bind:toggled={$values.spotInstances} />
      </SettingRow>
    </SettingsSection>
    <SettingsSaveBar />
  </Stack>
</SettingsPage>
