<script lang="ts">
  import {
    Box,
    Button,
    Checkbox,
    CodeSnippet,
    Column,
    Content,
    createTheme,
    Grid,
    InlineNotification,
    Link,
    ListItem,
    NotificationActionButton,
    ProgressIndicator,
    ProgressStep,
    RadioButton,
    RadioButtonGroup,
    Row,
    Stack,
    Tab,
    TabContent,
    Tabs,
    Text,
    TextArea,
    TextInput,
    Tile,
    UnorderedList,
  } from "carbon-components-svelte";
  import {
    type CarbonTheme,
    themes,
  } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import { parseHex } from "carbon-components-svelte/src/utils/color-contrast.js";
  import ColorPalette from "carbon-icons-svelte/lib/ColorPalette.svelte";
  import DocHero from "../components/DocHero.svelte";
  import DocSection from "../components/DocSection.svelte";
  import { theme as docTheme } from "../store";
  import {
    brandPresets,
    createThemeSnippet,
    parseOverrides,
    previewStyle,
    themeSnippet,
  } from "../theme-builder";

  const themeKeys = Object.keys(themes) as CarbonTheme[];

  let base: CarbonTheme = $docTheme;
  let brandInput = brandPresets[0].color;
  let overridesText = "";
  let overrides: ReturnType<typeof parseOverrides>["tokens"] = {};
  let invalid: string[] = [];

  $: brandValid = parseHex(brandInput.trim()) !== null;
  $: ({ tokens: overrides, invalid } = parseOverrides(overridesText));

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
</script>

<svelte:head>
  <title>Theme builder · Carbon Components Svelte</title>
  <meta
    name="description"
    content="Build a brand theme from one color: preview it, check contrast, and copy the tokens or CSS."
  />
</svelte:head>

<Content>
  <DocHero
    eyebrow="Theming"
    icon={ColorPalette}
    title="Theme builder"
    description="Pick a base theme and a brand color. The builder derives the tokens Carbon pairs with its brand blue, checks contrast, and gives you the code."
  />

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

              <TextArea
                labelText="Overrides (optional)"
                helperText="One token per line. Overrides win over derived tokens."
                placeholder="text-on-color: #161616"
                rows={4}
                warn={invalid.length > 0}
                warnText="Not a color token: {invalid.join(', ')}"
                bind:value={overridesText}
              />

              <Stack gap={3}>
                <Text tag="h2" type="heading-02" color="primary">Contrast</Text>
                {#if result.warnings.length > 0}
                  <InlineNotification
                    kind="warning"
                    role="status"
                    lowContrast
                    hideCloseButton
                    title="Below WCAG AA:"
                  >
                    <UnorderedList slot="subtitleChildren">
                      {#each result.warnings as warning (warning.foreground + warning.background)}
                        <ListItem>
                          {warning.foreground}
                          on {warning.background} is
                          {warning.ratio}:1 and needs {warning.minimum}:1.
                        </ListItem>
                      {/each}
                    </UnorderedList>
                  </InlineNotification>
                {:else}
                  <InlineNotification
                    kind="success"
                    role="status"
                    lowContrast
                    hideCloseButton
                    title="Passes WCAG AA:"
                    subtitle="Text on the brand, links, and focus all have enough contrast."
                  />
                {/if}
              </Stack>
            </Stack>
          </Box>
        </Column>

        <Column sm={4} md={8} lg={11}>
          <Stack gap={7}>
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

                  <Tabs>
                    <Tab label="Overview" />
                    <Tab label="Metrics" />
                    <Tab label="Settings" />
                    <svelte:fragment slot="content">
                      <TabContent>
                        <Text color="primary">api-gateway runs in us-east.</Text
                        >
                      </TabContent>
                      <TabContent>
                        <Text color="primary">p95 latency is 120 ms.</Text>
                      </TabContent>
                      <TabContent>
                        <Text color="primary">Autoscaling is on.</Text>
                      </TabContent>
                    </svelte:fragment>
                  </Tabs>

                  <Stack gap={5}>
                    <TextInput
                      labelText="Service name"
                      placeholder="api-gateway"
                    />
                    <Checkbox labelText="Enable autoscaling" checked />
                  </Stack>

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

            <Stack gap={3}>
              <Text tag="h2" type="heading-02" color="primary">Export</Text>
              <Tabs>
                <Tab label="Theme" />
                <Tab label="createTheme" />
                <Tab label="CSS" />
                <svelte:fragment slot="content">
                  <TabContent>
                    <CodeSnippet
                      type="multi"
                      code={themeSnippet(result.theme, result.tokens)}
                    />
                  </TabContent>
                  <TabContent>
                    <CodeSnippet
                      type="multi"
                      code={createThemeSnippet(result.theme, brand, overrides)}
                    />
                  </TabContent>
                  <TabContent>
                    <CodeSnippet type="multi" code={result.css()} />
                  </TabContent>
                </svelte:fragment>
              </Tabs>
              <Text type="body-01" color="secondary">
                Load the CSS after all.css. It applies while the base theme is
                set on the html element.
              </Text>
            </Stack>
          </Stack>
        </Column>
      </Row>
    </Grid>
  </DocSection>
</Content>
