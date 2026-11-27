<script lang="ts">
  import SettingRow from "carbon-components-svelte/SettingsPage/SettingRow.svelte";
  import SettingsNav from "carbon-components-svelte/SettingsPage/SettingsNav.svelte";
  import SettingsPage from "carbon-components-svelte/SettingsPage/SettingsPage.svelte";
  import SettingsSaveBar from "carbon-components-svelte/SettingsPage/SettingsSaveBar.svelte";
  import SettingsSection from "carbon-components-svelte/SettingsPage/SettingsSection.svelte";
  import {
    createSettings,
    type SettingsSaveResult,
  } from "carbon-components-svelte/SettingsPage/create-settings.js";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";

  export let save: (
    values: Record<string, unknown>,
  ) => SettingsSaveResult | Promise<SettingsSaveResult> = () => {};
  export let query = "";
  export let optimistic = false;
  export let onsave: (detail: unknown) => void = () => {};
  export let locked = false;

  export const settings = createSettings(
    { name: "Priya", email: true, plan: "pro" },
    { optimistic, defaults: { name: "", email: true } },
  );
  const { values } = settings;
</script>

<SettingsPage
  {settings}
  {save}
  bind:query
  on:save={(event) => onsave(event.detail)}
  data-testid="page"
>
  <SettingsNav
    sections={[
      { id: "profile", text: "Profile" },
      { id: "alerts", text: "Alerts" },
    ]}
  />
  <SettingsSection id="profile" title="Profile" description="Who you are.">
    <SettingRow
      name="name"
      label="Display name"
      description="Shown to your team."
      keywords={["nickname"]}
      let:controlProps
      let:invalid
      let:invalidText
    >
      <TextInput
        {...controlProps}
        {invalid}
        {invalidText}
        bind:value={$values.name}
      />
    </SettingRow>
  </SettingsSection>
  <SettingsSection id="alerts" title="Alerts">
    <SettingRow name="email" label="Email alerts" {locked} let:controlProps>
      <Toggle {...controlProps} bind:toggled={$values.email} />
    </SettingRow>
  </SettingsSection>
  <SettingsSaveBar />
</SettingsPage>
