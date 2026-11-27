<script>
  import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Column,
    ConfirmModal,
    createSettings,
    Dropdown,
    EmptyState,
    Grid,
    Heading,
    InlineNotification,
    NotificationQueue,
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

  const saved = {
    username: "priya.natarajan",
    displayName: "Priya Natarajan",
    timeZone: "america-new-york",
    productUpdates: false,
    billingAlerts: true,
    incidentAlerts: true,
    digest: "daily",
    mfa: true,
    sessionTimeout: "30",
    apiRateLimit: 600,
  };

  const settings = createSettings(saved, {
    defaults: {
      ...saved,
      displayName: "",
      productUpdates: true,
      digest: "immediately",
      sessionTimeout: "60",
      apiRateLimit: 300,
    },
  });
  const { values } = settings;

  const sections = [
    { id: "profile", text: "Profile" },
    { id: "notifications", text: "Notifications" },
    { id: "security", text: "Security" },
    { id: "workspace", text: "Workspace" },
    { id: "danger-zone", text: "Danger zone" },
  ];

  const timeZones = [
    { value: "america-los-angeles", text: "Pacific Time (UTC-08:00)" },
    { value: "america-new-york", text: "Eastern Time (UTC-05:00)" },
    { value: "europe-berlin", text: "Central European Time (UTC+01:00)" },
  ];

  const sessionTimeouts = [
    { id: "15", text: "15 minutes" },
    { id: "30", text: "30 minutes" },
    { id: "60", text: "1 hour" },
  ];

  const takenUsernames = ["admin", "billing", "support"];

  let queue;
  let query = "";
  let resultCount = 0;
  let failure = "";
  let deleteOpen = false;
  let leavingTo = "";

  async function save(next) {
    // For demo purposes only: a real page would call its API here.
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (takenUsernames.includes(next.username)) {
      return { errors: { username: "That username is taken." } };
    }
  }

  function handleSave(event) {
    if (event.detail.ok) {
      failure = "";
      queue.add({
        kind: "success",
        title: "Settings saved",
        timeout: 3000,
      });
    } else {
      failure = "Fix the highlighted settings, then save again.";
    }
  }

  // A router calls the guard from its navigation hook. See "Leaving the page".
  async function leave(to) {
    if (await settings.unsaved.guard()) leavingTo = to;
  }

  async function deleteWorkspace() {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
</script>

<NotificationQueue bind:this={queue} />

<SettingsPage
  {settings}
  {save}
  bind:query
  bind:resultCount
  on:save={handleSave}
>
  <Grid fullWidth>
    <Row>
      <Column>
        <Stack gap={5}>
          <Breadcrumb noTrailingSlash>
            <BreadcrumbItem href="#organization">Acme Cloud</BreadcrumbItem>
            <BreadcrumbItem href="#settings" isCurrentPage>
              Account settings
            </BreadcrumbItem>
          </Breadcrumb>
          <Heading>Account settings</Heading>
          <Search
            labelText="Search settings"
            placeholder="Search settings"
            shortcut="/"
            bind:value={query}
          />
          <Stack gap={3} orientation="horizontal" align="center">
            <Button kind="tertiary" size="sm" on:click={() => leave("billing")}>
              Go to billing
            </Button>
            {#if leavingTo}
              <Text type="helper-text-01" color="secondary">
                Left the page for {leavingTo}.
              </Text>
            {/if}
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
            <EmptyState
              title="No settings match"
              subtitle="Check the spelling, or search for a word the setting would use, such as “email” or “timeout”."
              size="sm"
            />
          {/if}

          <SettingsSection
            id="profile"
            title="Profile"
            description="How you appear to your team."
          >
            <SettingRow
              name="username"
              label="Username"
              description="Used in mentions and in your profile URL."
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
              description="Shown next to your comments and commits."
              let:controlProps
            >
              <TextInput {...controlProps} bind:value={$values.displayName} />
            </SettingRow>
            <SettingRow
              name="timeZone"
              label="Time zone"
              description="Dates in digests and audit logs use this zone."
              keywords={["timezone", "locale"]}
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
              description="News about new features and releases."
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.productUpdates} />
            </SettingRow>
            <SettingRow
              name="billingAlerts"
              label="Billing alerts"
              description="Invoices, failed payments and plan changes."
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.billingAlerts} />
            </SettingRow>
            <SettingRow
              name="incidentAlerts"
              label="Incident alerts"
              description="Outages that affect your workspace. Your organization requires these."
              locked
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.incidentAlerts} />
            </SettingRow>
            <SettingRow
              name="digest"
              label="Digest frequency"
              description="Bundle low-priority notifications into one email."
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
            description="Protect your account and its sessions."
          >
            <SettingRow
              name="mfa"
              label="Two-factor authentication"
              description="Ask for a code from your authenticator app when you sign in."
              let:controlProps
            >
              <Toggle {...controlProps} bind:toggled={$values.mfa} />
            </SettingRow>
            <SettingRow
              name="sessionTimeout"
              label="Session timeout"
              description="Sign out after a period of inactivity."
              let:controlProps
            >
              <Dropdown
                {...controlProps}
                items={sessionTimeouts}
                bind:selectedId={$values.sessionTimeout}
              />
            </SettingRow>
          </SettingsSection>

          <SettingsSection
            id="workspace"
            title="Workspace"
            description="Limits for the Acme Cloud production workspace."
          >
            <SettingRow
              name="apiRateLimit"
              label="API rate limit"
              description="Requests per minute for each API key."
              let:controlProps
            >
              <NumberInput
                {...controlProps}
                min={60}
                max={6000}
                step={60}
                bind:value={$values.apiRateLimit}
              />
            </SettingRow>
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
              description="Permanently removes every project, API key and member."
            >
              <Button
                kind="danger-tertiary"
                on:click={() => (deleteOpen = true)}
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
  confirmationPhrase="acme-production"
  confirm={deleteWorkspace}
>
  This permanently deletes the workspace, its API keys and its audit log.
</ConfirmModal>
