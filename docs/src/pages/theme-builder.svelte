<script lang="ts">
  import {
    Box,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Checkbox,
    Column,
    Content,
    createTheme,
    DataTable,
    Dropdown,
    Grid,
    InlineLoading,
    InlineNotification,
    Link,
    NotificationActionButton,
    OverflowMenu,
    OverflowMenuItem,
    PaginationNav,
    ProgressBar,
    ProgressIndicator,
    ProgressStep,
    RadioButton,
    RadioButtonGroup,
    Row,
    Search,
    Slider,
    Stack,
    Tab,
    TabContent,
    Tabs,
    Tag,
    Text,
    TextInput,
    Tile,
    Toggle,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import {
    type CarbonTheme,
    themes,
  } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import { parseHex } from "carbon-components-svelte/src/utils/color-contrast.js";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import ColorPalette from "carbon-icons-svelte/lib/ColorPalette.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import { onMount } from "svelte";
  import CodeBlock from "../components/CodeBlock.svelte";
  import DocCodeBox from "../components/DocCodeBox.svelte";
  import DocHero from "../components/DocHero.svelte";
  import DocSection from "../components/DocSection.svelte";
  import TokenOverrides from "../components/TokenOverrides.svelte";
  import { theme as docTheme } from "../store";
  import {
    brandPresets,
    createThemeSnippet,
    parseBuilderState,
    parseOverrides,
    previewStyle,
    serializeBuilderState,
    themeSnippet,
  } from "../theme-builder";

  const themeKeys = Object.keys(themes) as CarbonTheme[];

  let base: CarbonTheme = $docTheme;
  let brandInput = brandPresets[0].color;
  let overrides: ReturnType<typeof parseOverrides>["tokens"] = {};

  $: brandValid = parseHex(brandInput.trim()) !== null;

  // Keep the last valid theme while the brand color is being typed.
  let result = createTheme({ theme: base, brand: brandPresets[0].color });
  $: if (brandValid) {
    result = createTheme({
      theme: base,
      brand: brandInput.trim(),
      tokens: overrides,
    });
  }

  $: brand = result.tokens["button-primary"] ?? brandInput;
  $: preset = brandPresets.find((p) => p.color === brand)?.color;

  // A shared link sets the starting state. Save writes the current state
  // to the URL and copies the link.
  let saved = false;
  let savedTimeout: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    const state = parseBuilderState(
      new URLSearchParams(window.location.search),
      themeKeys,
    );
    if (state.theme) base = state.theme;
    if (state.brand) brandInput = state.brand;
    if (state.overrides) overrides = parseOverrides(state.overrides).tokens;
    return () => clearTimeout(savedTimeout);
  });

  async function save() {
    const search = serializeBuilderState({
      theme: base,
      brand: brandInput,
      overrides: Object.entries(overrides)
        .map(([token, value]) => `${token}: ${value}`)
        .join("\n"),
    });
    // Write the URL without a route change, so the page keeps its scroll.
    history.replaceState(history.state, "", `?${search}`);
    await navigator.clipboard.writeText(window.location.href);
    saved = true;
    clearTimeout(savedTimeout);
    savedTimeout = setTimeout(() => (saved = false), 2000);
  }

  const tagTypes = [
    "red",
    "magenta",
    "purple",
    "blue",
    "cyan",
    "teal",
    "green",
    "gray",
    "cool-gray",
    "warm-gray",
  ] as const;
  const notificationKinds = [
    {
      kind: "success",
      title: "Deployed:",
      subtitle: "cron is live in us-west.",
    },
    {
      kind: "warning",
      title: "Usage at 80%:",
      subtitle: "add instances before the next peak.",
    },
    {
      kind: "error",
      title: "Health check failed:",
      subtitle: "worker is down.",
    },
  ] as const;

  const tableHeaders = [
    { key: "name", value: "Service" },
    { key: "region", value: "Region" },
    { key: "status", value: "Status" },
    { key: "overflow", empty: true },
  ] as const;
  const tableRows = [
    { id: "a", name: "api-gateway", region: "us-east", status: "Live" },
    { id: "b", name: "worker", region: "eu-west", status: "Deploying" },
    { id: "c", name: "cron", region: "us-west", status: "Live" },
  ];
</script>

<svelte:head>
  <title>Theme builder · Carbon Components Svelte</title>
  <meta
    name="description"
    content="Build a brand theme from one color: preview it, check contrast, and copy the tokens or CSS."
  />
</svelte:head>

<Content>
  <DocHero eyebrow="Theming" icon={ColorPalette} title="Theme builder" />

  <DocSection>
    <Grid>
      <Row>
        <Column sm={4} md={8} lg={5}>
          <Box paddingBottom={7}>
            <Stack gap={7}>
              <RadioButtonGroup
                legendText="Base theme"
                orientation="vertical"
                bind:selected={base}
              >
                {#each themeKeys as value (value)}
                  <RadioButton labelText={themes[value]} {value} />
                {/each}
              </RadioButtonGroup>

              <Stack gap={5}>
                <TextInput
                  labelText="Brand color"
                  helperText="A hex color, like #0f62fe."
                  invalid={!brandValid}
                  invalidText="Enter a hex color, like #0f62fe."
                  spellcheck="false"
                  bind:value={brandInput}
                />
                <RadioButtonGroup
                  legendText="Presets"
                  orientation="vertical"
                  selected={preset}
                  on:change={(e) => {
                    if (e.detail) brandInput = e.detail;
                  }}
                >
                  {#each brandPresets as { name, color } (color)}
                    <RadioButton value={color}>
                      <svelte:fragment slot="labelChildren">
                        <Stack orientation="horizontal" gap={3} align="center">
                          <Box
                            width="1rem"
                            height="1rem"
                            fill="brand"
                            border="subtle"
                            style="--cds-background-brand: {color}"
                          />
                          {name}
                          <Text tag="span" type="code-01" color="secondary">
                            {color}
                          </Text>
                        </Stack>
                      </svelte:fragment>
                    </RadioButton>
                  {/each}
                </RadioButtonGroup>
              </Stack>

              <TokenOverrides
                theme={base}
                derived={result.tokens}
                bind:overrides
              />

              <Stack gap={3}>
                <Button
                  icon={saved ? Checkmark : Save}
                  disabled={!brandValid}
                  on:click={save}
                >
                  {saved ? "Link copied" : "Save"}
                </Button>
                <span class="bx--visually-hidden" role="status">
                  {saved ? "Link copied" : ""}
                </span>
              </Stack>
            </Stack>
          </Box>
        </Column>

        <Column sm={4} md={8} lg={11}>
          <Stack gap={7}>
            <Stack gap={3}>
              <Text tag="h2" type="heading-02" color="primary">Code</Text>
              <Tabs autoWidth>
                <Tab label="Theme" />
                <Tab label="createTheme" />
                <Tab label="CSS" />
                <svelte:fragment slot="content">
                  <TabContent flush class="doc-code-tab">
                    <DocCodeBox>
                      <CodeBlock
                        language="svelte"
                        code={themeSnippet(result.theme, result.tokens)}
                      />
                    </DocCodeBox>
                  </TabContent>
                  <TabContent flush class="doc-code-tab">
                    <DocCodeBox>
                      <CodeBlock
                        language="javascript"
                        code={createThemeSnippet(
                          result.theme,
                          brand,
                          overrides,
                        )}
                      />
                    </DocCodeBox>
                  </TabContent>
                  <TabContent flush class="doc-code-tab">
                    <DocCodeBox>
                      <CodeBlock language="css" code={result.css()} />
                    </DocCodeBox>
                  </TabContent>
                </svelte:fragment>
              </Tabs>
            </Stack>

            <Stack gap={3}>
              <Text tag="h2" type="heading-02" color="primary">Preview</Text>
              <!-- The base theme and brand tokens, scoped to this box. -->
              <Box
                fill="background"
                border="subtle"
                padding={6}
                style={previewStyle(base, result.tokens)}
              >
                <Stack gap={7}>
                  <Breadcrumb noTrailingSlash>
                    <BreadcrumbItem href="#preview">Services</BreadcrumbItem>
                    <BreadcrumbItem href="#preview">api-gateway</BreadcrumbItem>
                    <BreadcrumbItem href="#preview" isCurrentPage>
                      Deploys
                    </BreadcrumbItem>
                  </Breadcrumb>

                  <Stack orientation="horizontal" gap={4} wrap="wrap">
                    <Button>Deploy service</Button>
                    <Button kind="tertiary">Preview build</Button>
                    <Button kind="secondary">Cancel</Button>
                    <Button kind="ghost">View logs</Button>
                  </Stack>

                  <Text type="body-01" color="primary">
                    Read the
                    <Link inline href="#preview">deployment guide</Link>
                    or open the
                    <Link inline href="#preview">audit log</Link>.
                  </Text>

                  <ProgressIndicator currentIndex={1} spaceEqually>
                    <ProgressStep complete label="Connect repository" />
                    <ProgressStep label="Configure service" />
                    <ProgressStep label="Deploy" />
                  </ProgressIndicator>

                  <!-- One child, so the Stack gap stays out of the tab panel. -->
                  <div>
                    <Tabs type="container">
                      <Tab label="Overview" />
                      <Tab label="Metrics" />
                      <Tab label="Settings" />
                      <svelte:fragment slot="content">
                        <Box fill="layer-01">
                          <TabContent>
                            <Stack gap={3}>
                              <Text color="primary"
                                >api-gateway runs in us-east.</Text
                              >
                              <InlineLoading
                                description="Deploying build 142"
                              />
                            </Stack>
                          </TabContent>
                          <TabContent>
                            <Text color="primary">p95 latency is 120 ms.</Text>
                          </TabContent>
                          <TabContent>
                            <Text color="primary">Autoscaling is on.</Text>
                          </TabContent>
                        </Box>
                      </svelte:fragment>
                    </Tabs>
                  </div>

                  <Box
                    display="grid"
                    columns="repeat(auto-fit, minmax(16rem, 1fr))"
                    gap={7}
                    align="start"
                  >
                    <Stack gap={6}>
                      <Search size="lg" labelText="Search services" />
                      <TextInput
                        labelText="Service name"
                        placeholder="api-gateway"
                      />
                      <Dropdown
                        labelText="Region"
                        selectedId="us-east"
                        items={[
                          { id: "us-east", text: "us-east" },
                          { id: "eu-west", text: "eu-west" },
                        ]}
                      />
                      <Slider
                        labelText="Instances"
                        min={1}
                        max={10}
                        value={3}
                      />
                    </Stack>
                    <Stack gap={6}>
                      <Toggle labelText="Autoscaling" toggled />
                      <Checkbox labelText="Notify on deploy" checked />
                      <RadioButtonGroup
                        legendText="Plan"
                        selected="team"
                        orientation="vertical"
                      >
                        <RadioButton labelText="Hobby" value="hobby" />
                        <RadioButton labelText="Team" value="team" />
                      </RadioButtonGroup>
                      <ProgressBar
                        labelText="Build"
                        helperText="Step 3 of 5"
                        value={60}
                      />
                      <Stack orientation="horizontal" gap={3} wrap="wrap">
                        {#each tagTypes as type (type)}
                          <Tag {type}>{type}</Tag>
                        {/each}
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack gap={3}>
                    <DataTable
                      title="Services"
                      description="Select services to redeploy them together."
                      size="short"
                      batchSelection
                      selectedRowIds={["a", "c"]}
                      headers={tableHeaders}
                      rows={tableRows}
                    >
                      <Toolbar>
                        <ToolbarBatchActions>
                          <Button>Redeploy</Button>
                        </ToolbarBatchActions>
                        <ToolbarContent>
                          <ToolbarSearch />
                          <Button>Add service</Button>
                        </ToolbarContent>
                      </Toolbar>
                      <svelte:fragment slot="cell" let:cell>
                        {#if cell.key === "overflow"}
                          <OverflowMenu flipped size="sm">
                            <OverflowMenuItem text="View logs" />
                            <OverflowMenuItem text="Restart" />
                          </OverflowMenu>
                        {:else}
                          {cell.value}
                        {/if}
                      </svelte:fragment>
                    </DataTable>
                    <PaginationNav page={2} total={8} shown={5} />
                  </Stack>

                  <Stack gap={3}>
                    <InlineNotification
                      kind="info"
                      lowContrast
                      hideCloseButton
                      title="Deploy queued:"
                      subtitle="api-gateway starts in about two minutes."
                    >
                      <NotificationActionButton slot="actions">
                        View queue
                      </NotificationActionButton>
                    </InlineNotification>
                    {#each notificationKinds as { kind, title, subtitle } (kind)}
                      <InlineNotification
                        {kind}
                        lowContrast
                        hideCloseButton
                        {title}
                        {subtitle}
                      />
                    {/each}
                    <InlineNotification
                      kind="error"
                      hideCloseButton
                      title="Build failed:"
                      subtitle="worker exited with code 1."
                    />
                  </Stack>

                  <Tile>
                    <Stack gap={3}>
                      <Text type="heading-compact-01" color="primary">
                        Billing workspace
                      </Text>
                      <Text color="secondary">Team plan, renews on May 1.</Text>
                      <Link href="#preview">Manage plan</Link>
                    </Stack>
                  </Tile>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Column>
      </Row>
    </Grid>
  </DocSection>
</Content>
