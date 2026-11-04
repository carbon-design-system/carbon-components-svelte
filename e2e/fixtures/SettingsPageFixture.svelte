<script>
  import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Column,
    ConfirmModal,
    createSettings,
    Dropdown,
    Grid,
    Heading,
    InlineNotification,
    NumberInput,
    RadioButton,
    RadioButtonGroup,
    Row,
    Search,
    Select,
    SelectItem,
    SettingRow,
    SettingsNav,
    SettingsPage,
    SettingsSaveBar,
    SettingsSection,
    Stack,
    Text,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";

  const params = new URLSearchParams(window.location.search);
  // How many generated fields the "Advanced" section holds.
  const generated = Number(params.get("fields") ?? 6);
  // What the save does: "ok", "field" (server rejects a field), "network".
  const outcome = params.get("save") ?? "ok";
  const optimistic = params.has("optimistic");

  const extra = Array.from({ length: generated }, (_, index) => ({
    name: `limit${index + 1}`,
    label: `Quota ${index + 1}`,
    kind: index % 3 === 0 ? "text" : index % 3 === 1 ? "toggle" : "number",
  }));

  const initial = {
    username: "priya.n",
    displayName: "Priya Natarajan",
    timeZone: "utc-5",
    productUpdates: false,
    billingAlerts: true,
    securityAlerts: true,
    digest: "daily",
    mfa: true,
    sessionTimeout: "30",
    ...Object.fromEntries(
      extra.map((field) => [
        field.name,
        field.kind === "text"
          ? "default"
          : field.kind === "toggle"
            ? false
            : 10,
      ]),
    ),
  };

  const settings = createSettings(initial, {
    optimistic,
    defaults: {
      ...initial,
      displayName: "",
      productUpdates: true,
      digest: "immediately",
      sessionTimeout: "60",
    },
  });
  const { values, saved, dirty } = settings;

  const sections = [
    { id: "profile", text: "Profile" },
    { id: "notifications", text: "Notifications" },
    { id: "security", text: "Security" },
    { id: "advanced", text: "Advanced" },
    { id: "danger-zone", text: "Danger zone" },
  ];

  const timeZones = [
    { value: "utc-8", text: "Pacific Time (UTC-08:00)" },
    { value: "utc-5", text: "Eastern Time (UTC-05:00)" },
    { value: "utc", text: "Coordinated Universal Time" },
  ];

  const timeouts = [
    { id: "15", text: "15 minutes" },
    { id: "30", text: "30 minutes" },
    { id: "60", text: "1 hour" },
  ];

  let query = "";
  let resultCount = 0;
  let failure = "";
  let savedCount = 0;
  let deleteOpen = false;
  let deleted = false;
  let left = "";

  async function save() {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (outcome === "network") throw new Error("Network error");
    if (outcome === "field") {
      return {
        errors: {
          username: "That username is taken.",
          sessionTimeout: "Your plan allows at most 30 minutes.",
        },
      };
    }
  }

  function handleSave(event) {
    if (event.detail.ok) {
      failure = "";
      savedCount += 1;
    } else {
      failure = event.detail.error
        ? "We couldn't reach the server. Your changes are still here."
        : "Fix the highlighted settings, then save again.";
    }
  }

  // A router would call `interrupt` from its navigation hook.
  function navigate(to) {
    settings.unsaved.guard().then((approved) => {
      if (approved) left = to;
    });
  }

  async function deleteWorkspace() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    deleted = true;
  }
</script>

<SettingsPage
  {settings}
  {save}
  bind:query
  bind:resultCount
  on:save={handleSave}
  data-testid="page"
>
  <Grid fullWidth>
    <Row>
      <Column>
        <Stack gap={5}>
          <Breadcrumb noTrailingSlash>
            <BreadcrumbItem href="#account">Account</BreadcrumbItem>
            <BreadcrumbItem href="#settings" isCurrentPage
              >Settings</BreadcrumbItem
            >
          </Breadcrumb>
          <Heading>Account settings</Heading>
          <Search
            labelText="Search settings"
            placeholder="Search settings"
            bind:value={query}
          />
          <Stack gap={3} orientation="horizontal">
            <Button
              kind="tertiary"
              size="sm"
              on:click={() => navigate("billing")}
              data-testid="leave"
            >
              Go to billing
            </Button>
            <Text data-testid="left">{left}</Text>
          </Stack>
        </Stack>
      </Column>
    </Row>
    <Row>
      <Column sm={4} md={8} lg={4}>
        <SettingsNav {sections} />
      </Column>
      <Column sm={4} md={8} lg={10}>
        <Stack gap={7}>
          {#if failure}
            <InlineNotification
              kind="error"
              lowContrast
              title="Not saved"
              subtitle={failure}
              on:close={() => (failure = "")}
            />
          {/if}
          {#if query && resultCount === 0}
            <Text data-testid="no-results">No settings match “{query}”.</Text>
          {/if}

          <SettingsSection
            id="profile"
            title="Profile"
            description="How you appear to your team."
          >
            <SettingRow
              name="username"
              label="Username"
              description="Used in mentions and URLs."
              keywords={["handle"]}
              let:controlProps
              let:invalid
              let:invalidText
            >
              <TextInput
                {...controlProps}
                {invalid}
                {invalidText}
                bind:value={$values.username}
              />
            </SettingRow>
            <SettingRow
              name="displayName"
              label="Display name"
              description="Shown next to your comments."
              let:controlProps
            >
              <TextInput {...controlProps} bind:value={$values.displayName} />
            </SettingRow>
            <SettingRow
              name="timeZone"
              label="Time zone"
              description="Dates in digests use this zone."
              let:controlProps
            >
              <Select {...controlProps} bind:selected={$values.timeZone}>
                {#each timeZones as zone}
                  <SelectItem value={zone.value} text={zone.text} />
                {/each}
              </Select>
            </SettingRow>
          </SettingsSection>

          <SettingsSection
            id="notifications"
            title="Notifications"
            description="Choose what reaches your inbox."
            keywords={["email", "alerts"]}
          >
            <SettingRow
              name="productUpdates"
              label="Product updates"
              description="News about new features."
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.productUpdates} />
            </SettingRow>
            <SettingRow
              name="billingAlerts"
              label="Billing alerts"
              description="Invoices and failed payments."
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.billingAlerts} />
            </SettingRow>
            <SettingRow
              name="securityAlerts"
              label="Security alerts"
              description="Sign-ins from new devices."
              locked
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.securityAlerts} />
            </SettingRow>
            <SettingRow
              name="digest"
              label="Digest frequency"
              description="Bundle low-priority notifications."
              let:id
            >
              <RadioButtonGroup
                legendText="Digest frequency"
                hideLegend
                orientation="vertical"
                bind:selected={$values.digest}
              >
                <RadioButton value="immediately" labelText="Immediately" />
                <RadioButton value="daily" labelText="Daily" />
                <RadioButton value="weekly" labelText="Weekly" />
              </RadioButtonGroup>
            </SettingRow>
          </SettingsSection>

          <SettingsSection
            id="security"
            title="Security"
            description="Protect your account."
          >
            <SettingRow
              name="mfa"
              label="Two-factor authentication"
              description="Ask for a code when you sign in."
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.mfa} />
            </SettingRow>
            <SettingRow
              name="sessionTimeout"
              label="Session timeout"
              description="Sign out after a period of inactivity."
              let:controlProps
              let:invalid
              let:invalidText
            >
              <Dropdown
                {...controlProps}
                {invalid}
                {invalidText}
                items={timeouts}
                bind:selectedId={$values.sessionTimeout}
              />
            </SettingRow>
          </SettingsSection>

          <SettingsSection
            id="advanced"
            title="Advanced"
            description="Quotas for your workspace."
          >
            {#each extra as field (field.name)}
              <SettingRow
                name={field.name}
                label={field.label}
                description="Applies to every project."
                let:controlProps
              >
                {#if field.kind === "text"}
                  <TextInput
                    {...controlProps}
                    bind:value={$values[field.name]}
                  />
                {:else if field.kind === "toggle"}
                  <Toggle
                    {...controlProps}
                    bind:toggled={$values[field.name]}
                  />
                {:else}
                  <NumberInput
                    {...controlProps}
                    bind:value={$values[field.name]}
                  />
                {/if}
              </SettingRow>
            {/each}
          </SettingsSection>

          <SettingsSection
            id="danger-zone"
            title="Danger zone"
            kind="danger"
            description="These actions can't be undone."
            keywords={["delete", "remove"]}
          >
            <SettingRow
              label="Delete workspace"
              description="Removes every project, key and member."
            >
              <Button
                kind="danger-tertiary"
                on:click={() => (deleteOpen = true)}
                data-testid="delete"
              >
                Delete workspace
              </Button>
            </SettingRow>
          </SettingsSection>

          <SettingsSaveBar />
        </Stack>
      </Column>
    </Row>
  </Grid>
</SettingsPage>

<ConfirmModal
  bind:open={deleteOpen}
  title="Delete workspace"
  confirmText="Delete workspace"
  confirmationPhrase="acme-prod"
  confirm={deleteWorkspace}
>
  This permanently deletes the workspace.
</ConfirmModal>

<Text data-testid="deleted">{deleted ? "deleted" : ""}</Text>
<Text data-testid="saved-count">{savedCount}</Text>
<Text data-testid="dirty">{$dirty}</Text>
<Text data-testid="saved-name">{$saved.displayName}</Text>
