<script lang="ts">
  import {
    Box,
    Button,
    Column,
    Content,
    Grid,
    Link,
    OutboundLink,
    Row,
    Slider,
    Stack,
    Tab,
    TabContent,
    Tabs,
    Text,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import ArrowUpRight from "carbon-icons-svelte/lib/ArrowUpRight.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Catalog from "carbon-icons-svelte/lib/Catalog.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import UserAvatar from "carbon-icons-svelte/lib/UserAvatar.svelte";
  import Analytics from "carbon-pictograms-svelte/lib/Analytics.svelte";
  import Cloud from "carbon-pictograms-svelte/lib/Cloud.svelte";
  import Code from "carbon-pictograms-svelte/lib/Code.svelte";
  import DataStorage from "carbon-pictograms-svelte/lib/DataStorage.svelte";
  import CodeBlock from "../components/CodeBlock.svelte";
  import DocCodeBox from "../components/DocCodeBox.svelte";
  import DocFooterCta from "../components/DocFooterCta.svelte";
  import DocHero from "../components/DocHero.svelte";
  import DocPackageManagerTabs from "../components/DocPackageManagerTabs.svelte";
  import DocSection from "../components/DocSection.svelte";
  import DocSectionHeader from "../components/DocSectionHeader.svelte";
  import DocSplitRow from "../components/DocSplitRow.svelte";
  import DocThemePicker from "../components/DocThemePicker.svelte";
  import {
    dynamicThemeCss,
    iconsExample,
    iconsInstallCmds,
    installCmds,
    pictogramsExample,
    pictogramsInstallCmds,
    preprocessInstallCmds,
    preprocessors,
    rollupConfig,
    sveltekitConfig,
    sveltekitViteConfig,
    themeCssImport,
    themeHtml,
    themeToggle,
    usageExample,
    viteConfig,
    webpackConfig,
  } from "../quick-start-snippets";
  import { theme } from "../store";

  const iconSizes = [16, 20, 24, 32];
  let iconSizeIndex = 0;
  $: iconSize = iconSizes[iconSizeIndex];

  let pictogramSize = 64;

  $: iconsExampleSnippet = iconsExample(iconSize);
  $: pictogramsExampleSnippet = pictogramsExample(pictogramSize);
  $: themeCssSnippet = themeCssImport($theme);
  $: themeToggleSnippet = themeToggle($theme);
  $: themeHtmlSnippet = themeHtml($theme);
</script>

<svelte:head>
  <title>Quick start · Carbon Components Svelte</title>
  <meta
    name="description"
    content="Install Carbon Components Svelte, apply a Carbon theme, and start composing UI."
  >
</svelte:head>

<Content class="quick-start-page">
  <DocHero eyebrow="Get started" title="Quick start" />

  <DocSection>
    <Grid>
      <DocSplitRow variant="step" step="01" title="Install the package">
        <svelte:fragment slot="right">
          <DocPackageManagerTabs cmds={installCmds} />
        </svelte:fragment>
      </DocSplitRow>

      <DocSplitRow variant="step" step="02" title="Apply a theme stylesheet">
        <svelte:fragment slot="right">
          <Stack gap={5}>
            <DocThemePicker legendText="Theme" orientation="horizontal" />
            <DocCodeBox>
              <CodeBlock
                type="single"
                language="javascript"
                code={themeCssSnippet}
              />
            </DocCodeBox>
            <Text type="caption-01" color="secondary">
              Import this once at the top-level, like index.js or
              src/+layout.svelte.
            </Text>
          </Stack>
        </svelte:fragment>
      </DocSplitRow>

      <DocSplitRow variant="step" step="03" title="Import a component">
        <svelte:fragment slot="right">
          <Stack gap={5}>
            <DocCodeBox>
              <CodeBlock language="svelte" code={usageExample} />
            </DocCodeBox>
            <Text type="caption-01" color="secondary">
              Explore the full{' '}
              <Link inline size="sm" href="/component-index">
                component index.
              </Link>
            </Text>
          </Stack>
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Theming"
        title="Dynamic theming"
        description="To switch themes at runtime, import the combined all.css stylesheet instead of a single theme. It bundles all five themes and toggles between them through a theme attribute on the HTML element."
      />

      <DocSplitRow variant="example">
        <svelte:fragment slot="left">
          <Column sm={4} md={8} lg={4}>
            <DocThemePicker legendText="Carbon themes" />
          </Column>
        </svelte:fragment>
        <svelte:fragment slot="right">
          <Column sm={4} md={8} lg={12} xlg={8} class="code-col">
            <Stack gap={7}>
              <Stack gap={3}>
                <Text type="caption-01" color="secondary" maxWidth="60ch">
                  Import the stylesheet once, at the top-level entry point of
                  your app.
                </Text>
                <DocCodeBox>
                  <CodeBlock
                    type="single"
                    language="javascript"
                    code={dynamicThemeCss}
                  />
                </DocCodeBox>
              </Stack>
              <Stack gap={3}>
                <Text type="caption-01" color="secondary">
                  Then set the theme reactively in Svelte:
                </Text>
                <DocCodeBox>
                  <CodeBlock language="svelte" code={themeToggleSnippet} />
                </DocCodeBox>
              </Stack>
              <Stack gap={3}>
                <Text type="caption-01" color="secondary">
                  Or statically in your HTML:
                </Text>
                <DocCodeBox>
                  <CodeBlock language="svelte" code={themeHtmlSnippet} />
                </DocCodeBox>
              </Stack>
              <Text type="body-long-01" color="secondary" maxWidth="60ch">
                Or use the
                <Link inline href="/components/Theme">Theme component</Link>
                to manage the theme reactively.
              </Text>
            </Stack>
          </Column>
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Going further"
        title="Faster builds, smaller bundles"
        maxWidth="58ch"
      >
        <svelte:fragment slot="description">
          <Text type="body-long-02" color="secondary" maxWidth="58ch">
            The fast path is enough to build.
            <OutboundLink
              inline
              size="lg"
              href="https://github.com/carbon-design-system/carbon-preprocess-svelte"
            >
              carbon-preprocess-svelte
            </OutboundLink>
            trims build times and bundle size with two drop-in tools for faster
            HMR in development and leaner CSS when you ship.
          </Text>
        </svelte:fragment>
      </DocSectionHeader>

      <Row class="example-row">
        {#each preprocessors as preprocessor (preprocessor.title)}
          <Column sm={4} md={8} lg={8} xlg={5}>
            <Stack gap={2}>
              <Text tag="h3" type="heading-02" color="primary">
                {preprocessor.title}
              </Text>
              <Text type="body-long-01" color="secondary" maxWidth="40ch">
                {preprocessor.body}
              </Text>
            </Stack>
          </Column>
        {/each}
      </Row>

      <DocSplitRow
        variant="step"
        step="01"
        title="Install"
        description="Add carbon-preprocess-svelte as a dev dependency."
      >
        <svelte:fragment slot="right">
          <DocPackageManagerTabs cmds={preprocessInstallCmds} />
        </svelte:fragment>
      </DocSplitRow>

      <DocSplitRow
        variant="step"
        step="02"
        title="Configure your bundler"
        description="Add optimizeImports to your Svelte preprocessor and optimizeCss to your bundler plugins."
      >
        <svelte:fragment slot="right">
          <div class="install-tabs">
            <Tabs autoWidth>
              <Tab label="Vite" />
              <Tab label="SvelteKit" />
              <Tab label="Rollup" />
              <Tab label="Webpack" />
              <svelte:fragment slot="content">
                <TabContent style="padding-left: 0; padding-right: 0;">
                  <DocCodeBox>
                    <CodeBlock language="javascript" code={viteConfig} />
                  </DocCodeBox>
                </TabContent>
                <TabContent style="padding-left: 0; padding-right: 0;">
                  <Stack gap={3}>
                    <DocCodeBox>
                      <CodeBlock language="javascript" code={sveltekitConfig} />
                    </DocCodeBox>
                    <DocCodeBox>
                      <CodeBlock
                        language="javascript"
                        code={sveltekitViteConfig}
                      />
                    </DocCodeBox>
                  </Stack>
                </TabContent>
                <TabContent style="padding-left: 0; padding-right: 0;">
                  <DocCodeBox>
                    <CodeBlock language="javascript" code={rollupConfig} />
                  </DocCodeBox>
                </TabContent>
                <TabContent style="padding-left: 0; padding-right: 0;">
                  <DocCodeBox>
                    <CodeBlock language="javascript" code={webpackConfig} />
                  </DocCodeBox>
                </TabContent>
              </svelte:fragment>
            </Tabs>
          </div>
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Iconography"
        title="Add icons and pictograms"
        description="The icon and pictogram sets ship as separate packages of individual Svelte components. Both are professionally designed, original iconography crafted to complement the scale and grid of Carbon components. Each is optional, so install only what you need."
      />

      <Row class="example-row">
        <Column sm={4} md={8} lg={8} class="code-col">
          <Stack gap={5}>
            <Text tag="h3" type="productive-heading-03" color="primary">
              Icons
            </Text>
            <Stack gap={3}>
              <div class="glyph-desc">
                <Text type="body-long-01" color="secondary" maxWidth="40ch">
                  2,500+ icons designed for product UI, in four sizes (16, 20,
                  24, and 32 pixels), set with a single prop.
                </Text>
              </div>
              <div class="install-tabs">
                <DocPackageManagerTabs cmds={iconsInstallCmds} />
              </div>
            </Stack>
            <Stack gap={3}>
              <Text type="label-01" color="secondary">Usage</Text>
              <DocCodeBox>
                <CodeBlock language="svelte" code={iconsExampleSnippet} />
              </DocCodeBox>
            </Stack>
            <Stack gap={3}>
              <Text type="label-01" color="secondary">Demo</Text>
              <Box fill="layer-01" padding={6}>
                <Stack gap={6}>
                  <Slider
                    labelText="Size ({iconSize}px)"
                    min={0}
                    max={3}
                    step={1}
                    bind:value={iconSizeIndex}
                    hideTextInput
                    fullWidth
                    minLabel="16"
                    maxLabel="32"
                  />
                  <div class="glyph-grid glyph-grid--icons">
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Add</Text>
                      <div class="glyph-icon">
                        <Add size={iconSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Edit</Text>
                      <div class="glyph-icon">
                        <Edit size={iconSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Search</Text>
                      <div class="glyph-icon">
                        <Search size={iconSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Settings</Text>
                      <div class="glyph-icon">
                        <Settings size={iconSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary"
                        >Notification</Text
                      >
                      <div class="glyph-icon">
                        <Notification size={iconSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Calendar</Text>
                      <div class="glyph-icon">
                        <Calendar size={iconSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary"
                        >UserAvatar</Text
                      >
                      <div class="glyph-icon">
                        <UserAvatar size={iconSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">TrashCan</Text>
                      <div class="glyph-icon">
                        <TrashCan size={iconSize} />
                      </div>
                    </div>
                  </div>
                </Stack>
              </Box>
            </Stack>
            <Link
              size="lg"
              icon={ArrowUpRight}
              href="https://github.com/carbon-design-system/carbon-icons-svelte"
              target="_blank"
            >
              Browse icons
            </Link>
          </Stack>
        </Column>

        <Column sm={4} md={8} lg={8} class="code-col">
          <Stack gap={5}>
            <Text tag="h3" type="productive-heading-03" color="primary">
              Pictograms
            </Text>
            <Stack gap={3}>
              <div class="glyph-desc">
                <Text type="body-long-01" color="secondary" maxWidth="40ch">
                  1,500+ illustrative pictograms for empty states, onboarding,
                  hero sections, and feature callouts. Larger than icons, 64px
                  by default.
                </Text>
              </div>
              <div class="install-tabs">
                <DocPackageManagerTabs cmds={pictogramsInstallCmds} />
              </div>
            </Stack>
            <Stack gap={3}>
              <Text type="label-01" color="secondary">Usage</Text>
              <DocCodeBox>
                <CodeBlock language="svelte" code={pictogramsExampleSnippet} />
              </DocCodeBox>
            </Stack>
            <Stack gap={3}>
              <Text type="label-01" color="secondary">Demo</Text>
              <Box fill="layer-01" padding={6}>
                <Stack gap={6}>
                  <Slider
                    labelText="Size ({pictogramSize}px)"
                    min={48}
                    max={64}
                    step={4}
                    bind:value={pictogramSize}
                    hideTextInput
                    fullWidth
                    minLabel="48"
                    maxLabel="64"
                  />
                  <div class="glyph-grid glyph-grid--pictograms">
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Analytics</Text>
                      <div class="glyph-icon glyph-icon--pictogram">
                        <Analytics
                          width={pictogramSize}
                          height={pictogramSize}
                        />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Cloud</Text>
                      <div class="glyph-icon glyph-icon--pictogram">
                        <Cloud width={pictogramSize} height={pictogramSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary">Code</Text>
                      <div class="glyph-icon glyph-icon--pictogram">
                        <Code width={pictogramSize} height={pictogramSize} />
                      </div>
                    </div>
                    <div class="glyph-cell">
                      <Text type="caption-01" color="secondary"
                        >DataStorage</Text
                      >
                      <div class="glyph-icon glyph-icon--pictogram">
                        <DataStorage
                          width={pictogramSize}
                          height={pictogramSize}
                        />
                      </div>
                    </div>
                  </div>
                </Stack>
              </Box>
            </Stack>
            <Link
              size="lg"
              icon={ArrowUpRight}
              href="https://github.com/carbon-design-system/carbon-pictograms-svelte"
              target="_blank"
            >
              Browse pictograms
            </Link>
          </Stack>
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Reference"
        icon={Catalog}
        title="Documentation for LLMs"
        description="Documentation is available in LLM-friendly plain text for use with coding assistants, plus a standalone Markdown document for every component. Append .md to any component's URL to read it."
      />
      <Row class="example-row">
        <Column sm={4} md={8} lg={8} xlg={5}>
          <Stack gap={2}>
            <Text tag="h3" type="heading-02" color="primary">
              <Link
                size="lg"
                icon={ArrowUpRight}
                href="/llms.txt"
                target="_blank"
              >
                llms.txt
              </Link>
            </Text>
            <Text type="body-long-01" color="secondary" maxWidth="40ch">
              A component index where each entry links to its per-component
              Markdown doc, sized for model context windows.
            </Text>
          </Stack>
        </Column>
        <Column sm={4} md={8} lg={8} xlg={5}>
          <Stack gap={2}>
            <Text tag="h3" type="heading-02" color="primary">
              <Link
                size="lg"
                icon={ArrowUpRight}
                href="/llms-full.txt"
                target="_blank"
              >
                llms-full.txt
              </Link>
            </Text>
            <Text type="body-long-01" color="secondary" maxWidth="40ch">
              The full component documentation in a single plain-text file.
            </Text>
          </Stack>
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocFooterCta
    title="Start building with Carbon"
    description="You're set up. Explore every component, see live examples, and copy-paste your way to a screen."
  >
    <svelte:fragment slot="actions">
      <Stack orientation="horizontal" gap={4} align="center" wrap="wrap">
        <Button icon={ArrowRight} href="/component-index">
          Browse components
        </Button>
        <Button
          kind="tertiary"
          icon={LogoGithub}
          href="https://github.com/carbon-design-system/carbon-components-svelte"
          target="_blank"
        >
          View on GitHub
        </Button>
      </Stack>
    </svelte:fragment>
  </DocFooterCta>
</Content>

<style>
  .install-tabs {
    width: 100%;
    min-height: 5.75rem;
  }

  .glyph-desc {
    min-height: 5.5rem;
  }

  .glyph-grid {
    display: grid;
    gap: var(--cds-spacing-06) var(--cds-spacing-05);
    color: var(--cds-icon-01);
  }

  .glyph-grid--icons,
  .glyph-grid--pictograms {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    min-height: 8.75rem;
  }

  @media (max-width: 672px) {
    .glyph-grid--icons,
    .glyph-grid--pictograms {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .glyph-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--cds-spacing-03);
    text-align: left;
    min-width: 0;
  }

  .glyph-icon {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
    height: 2rem;
  }

  .glyph-icon--pictogram {
    height: auto;
    min-height: 4rem;
  }
</style>
