<script lang="ts">
  import {
    Button,
    Column,
    Content,
    Grid,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import Apps from "carbon-icons-svelte/lib/Apps.svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
  import Connect from "carbon-icons-svelte/lib/Connect.svelte";
  import ConnectionSignal from "carbon-icons-svelte/lib/ConnectionSignal.svelte";
  import DataStructured from "carbon-icons-svelte/lib/DataStructured.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import Popup from "carbon-icons-svelte/lib/Popup.svelte";
  import Replicate from "carbon-icons-svelte/lib/Replicate.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import Template from "carbon-icons-svelte/lib/Template.svelte";
  import Types from "carbon-icons-svelte/lib/Types.svelte";
  import DocBenefitGrid from "../components/DocBenefitGrid.svelte";
  import DocFooterCta from "../components/DocFooterCta.svelte";
  import DocHero from "../components/DocHero.svelte";
  import DocMetric from "../components/DocMetric.svelte";
  import DocSection from "../components/DocSection.svelte";
  import DocSectionHeader from "../components/DocSectionHeader.svelte";
  import DocSplitRow from "../components/DocSplitRow.svelte";
  import TileCard from "../components/TileCard.svelte";
  // import ComputeSizeTilesExample from "../components/examples/ComputeSizeTilesExample.svelte";
  // import DataTableExample from "../components/examples/DataTableExample.svelte";
  // import DeployPipelineExample from "../components/examples/DeployPipelineExample.svelte";
  // import FileUploaderExample from "../components/examples/FileUploaderExample.svelte";
  // import FilterableTreeExample from "../components/examples/FilterableTreeExample.svelte";
  // import InformationArchitectureExample from "../components/examples/InformationArchitectureExample.svelte";
  // import MaintenanceWindowExample from "../components/examples/MaintenanceWindowExample.svelte";
  // import ProvisionFormExample from "../components/examples/ProvisionFormExample.svelte";
  // import SignInExample from "../components/examples/SignInExample.svelte";
  // import ThemePreviewExample from "../components/examples/ThemePreviewExample.svelte";

  const principles = [
    {
      icon: Replicate,
      title: "Reuse",
      body: "Compose interfaces from primitives that already handle state, keyboard interaction, and focus management.",
    },
    {
      icon: Template,
      title: "Consistency",
      body: "Every component speaks the same type scale, spacing, and color tokens, so screens feel like one product.",
    },
    {
      icon: Settings,
      title: "Extensibility",
      body: "Restyle with design tokens, swap themes at runtime, and extend components with slots and forwarded props.",
    },
  ];

  const apiBenefits = [
    {
      icon: Apps,
      title: "Component composition",
      body: "Build complex UI from small, composable parts. Slots and nested components keep markup declarative.",
    },
    {
      icon: Types,
      title: "TypeScript generics",
      body: "Data-driven components like DataTable are generic over your row types, so data and cells stay type-safe end to end.",
    },
    {
      icon: Edit,
      title: "Slots for customization",
      body: "Named slots let you override any part of a component, from a table cell to an empty state, without forking it.",
    },
    {
      icon: Connect,
      title: "Events and bindings",
      body: "Dispatched events and two-way bindings keep wiring minimal. No extra stores or boilerplate required.",
    },
  ];

  const perfBenefits = [
    {
      icon: List,
      title: "Built-in virtualization",
      body: "Render only the rows in view, so long lists and tables stay responsive on large datasets.",
    },
    {
      icon: DataStructured,
      title: "Optimized data structures",
      body: "Large in-memory datasets use structures tuned for fast lookups, sorting, and updates.",
    },
    {
      icon: ConnectionSignal,
      title: "Pooled event listeners",
      body: "Shared, pooled listeners replace per-item handlers to cut memory use and setup cost.",
    },
    {
      icon: Popup,
      title: "Floating portal",
      body: "Tooltips, menus, and dialogs render through a floating portal to escape overflow and stacking contexts.",
    },
  ];
</script>

<svelte:head>
  <title>Carbon Components Svelte</title>
  <meta
    name="description"
    content="The Svelte implementation of the Carbon Design System featuring accessible UI components, icons, pictograms, and charts."
  />
  <link rel="canonical" href="https://svelte.carbondesignsystem.com/" />
</svelte:head>

<Content class="overview-page">
  <DocHero
    eyebrow="Carbon Components Svelte"
    icon={Carbon}
    titleType="expressive-heading-04"
    description="A complete component library that implements the IBM Carbon Design System. Ship accessible, consistent, production-ready interfaces."
    balance
  >
    <svelte:fragment slot="title">
      <Text
        tag="h1"
        type="expressive-heading-04"
        color="primary"
        balance
        maxWidth="32ch"
      >
        The Carbon Design System,<br />built for Svelte
      </Text>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <Stack orientation="horizontal" gap={4} align="center" wrap="wrap">
        <Button icon={ArrowRight} href="/quick-start">Get started</Button>
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
  </DocHero>

  <DocSection variant="metrics">
    <Grid>
      <Row>
        <Column>
          <div class="metrics-grid">
            <DocMetric
              value="50+"
              label="Components"
              caption="From inputs to data tables"
            />
            <DocMetric
            value="5"
            label="Built-in themes"
            caption="Two light, three dark"
          />
            <DocMetric
              value="TypeScript"
              label="Fully typed API"
              caption="Props, events, and slots"
            />
            <DocMetric
              value="WCAG 2.1 AA"
              label="Accessibility"
              caption="Keyboard and screen-reader ready"
            />
          </div>
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocSection variant="foundation">
    <Grid>
      <DocSectionHeader
        eyebrow="Proven at scale"
        title="The full design system"
        titleType="productive-heading-06"
        gap={6}
        maxWidth="62ch"
        wide
        balance
        description="A design system is a shared language — the guidelines, patterns, and reusable parts that keep teams aligned as products grow. Carbon is IBM's, proven across thousands of enterprise screens. Carbon Components Svelte ships it as real Svelte components, so accessibility, theming, and visual consistency come standard."
      />
      {#each principles as principle (principle.title)}
        <DocSplitRow
          variant="principle"
          icon={principle.icon}
          title={principle.title}
          description={principle.body}
        />
      {/each}
    </Grid>
  </DocSection>

  <DocSection variant="foundation">
    <Grid>
      <DocSectionHeader
        eyebrow="Not just a port"
        title="Idiomatic Svelte"
        titleType="productive-heading-06"
        gap={6}
        maxWidth="62ch"
        wide
        balance
        description="Two-way bindings, slot composition, and compile-time reactivity keep the runtime small. Minimal boilerplate and performance tuned for data-heavy applications."
      />

      <Row class="principle-row">
        <Column>
          <Stack gap={6}>
            <Text tag="h3" type="productive-heading-03" color="primary">
              The Svelte way
            </Text>
            <DocBenefitGrid items={apiBenefits} />
          </Stack>
        </Column>
      </Row>

      <Row class="principle-row">
        <Column>
          <Stack gap={6}>
            <Text tag="h3" type="productive-heading-03" color="primary">
              Fast at scale
            </Text>
            <DocBenefitGrid items={perfBenefits} />
          </Stack>
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <!-- Examples (revisit later)
  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Data table"
        title="Sort, filter, and paginate"
        description="DataTable provides sortable columns, batch selection, toolbar search, and pagination through one declarative API."
      />
    </Grid>
    <DataTableExample />
  </DocSection>

  <DocSection>
    <Grid>
      <DocSplitRow
        variant="example"
        eyebrow="Forms &amp; inputs"
        title="Accessible form controls"
        description="Text inputs, selects, number steppers, date pickers, radio groups, and toggles include labels, helper text, and validation."
        descriptionMaxWidth="40ch"
      >
        <svelte:fragment slot="right">
          <ProvisionFormExample />
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSplitRow
        variant="example"
        eyebrow="Fluid forms"
        title="Fluid forms, ranges, and sliders"
        description="FluidForm stacks condensed fields. Slider and a range DatePicker capture numeric and date ranges."
        descriptionMaxWidth="40ch"
      >
        <svelte:fragment slot="right">
          <MaintenanceWindowExample />
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSplitRow
        variant="example"
        eyebrow="File uploader"
        title="Drag-and-drop uploads"
        description="FileUploaderDropContainer accepts drag-and-drop or click to browse. FileUploaderItem tracks each file's upload status."
        descriptionMaxWidth="40ch"
      >
        <svelte:fragment slot="right">
          <FileUploaderExample />
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSplitRow
        variant="example"
        eyebrow="Tiles"
        title="Selectable tiles"
        description="RadioTile groups choices into selectable surfaces. ExpandableTile adds progressive disclosure."
        descriptionMaxWidth="40ch"
      >
        <svelte:fragment slot="right">
          <ComputeSizeTilesExample />
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSplitRow
        variant="example"
        eyebrow="Tree view"
        title="Filterable tree view"
        description="TreeView renders nested data with icons. Here it backs a file explorer with live filtering."
        descriptionMaxWidth="40ch"
      >
        <svelte:fragment slot="right">
          <FilterableTreeExample />
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Workflows"
        title="Guide multi-step work"
        description="Walk people through long-running tasks with clear stages, live progress, and status messages, so they always know what is happening and what comes next."
      />
      <Row class="example-row">
        <Column>
          <DeployPipelineExample />
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Information architecture"
        title="Organize dense interfaces"
        description="Give large applications a navigable shape, so people can move between summaries, nested resources, and history without losing their place."
      />
      <Row class="example-row">
        <Column>
          <InformationArchitectureExample />
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSplitRow
        variant="example"
        eyebrow="Theming"
        title="Five built-in themes"
        description="Every component is built on Carbon design tokens. Selecting a theme re-colors the whole library, including this page."
        descriptionMaxWidth="44ch"
      >
        <svelte:fragment slot="right">
          <ThemePreviewExample />
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSplitRow variant="example">
        <svelte:fragment slot="left">
          <Column sm={4} md={8} lg={6}>
            <Stack gap={3}>
              <Text type="caption-02" color="secondary">Composition</Text>
              <Text tag="h2" type="productive-heading-05" color="primary">
                Compose inputs into screens
              </Text>
              <Text type="body-long-02" color="secondary" maxWidth="44ch">
                Buttons, text inputs, password inputs, checkboxes, and links
                combine into complete screens.
              </Text>
            </Stack>
          </Column>
        </svelte:fragment>
        <svelte:fragment slot="right">
          <Column sm={4} md={8} lg={6}>
            <SignInExample />
          </Column>
        </svelte:fragment>
      </DocSplitRow>
    </Grid>
  </DocSection>
  -->

  <DocSection variant="ecosystem">
    <Grid>
      <Row>
        <Column>
          <Text tag="div" type="caption-02" color="secondary">GitHub repositories</Text>
        </Column>
      </Row>
      <Row class="ecosystem-row">
        <Column>
          <div>
            <Row noGutter>
              <Column xlg={5} lg={8} md={4}>
                <TileCard
                  borderRight
                  borderBottom
                  title="Carbon Components Svelte"
                  subtitle="50+ components"
                  target="_blank"
                  href="https://github.com/carbon-design-system/carbon-components-svelte"
                />
              </Column>
              <Column xlg={5} lg={8} md={4}>
                <TileCard
                  borderBottom
                  title="Carbon Icons Svelte"
                  subtitle="2,500+ icons"
                  target="_blank"
                  href="https://github.com/carbon-design-system/carbon-icons-svelte"
                />
              </Column>
            </Row>
            <Row noGutter>
              <Column xlg={5} lg={8} md={4}>
                <TileCard
                  borderBottom
                  borderRight
                  title="Carbon Pictograms Svelte"
                  subtitle="1,500+ pictograms"
                  target="_blank"
                  href="https://github.com/carbon-design-system/carbon-pictograms-svelte"
                />
              </Column>
              <Column xlg={5} lg={8} md={4}>
                <TileCard
                  borderBottom
                  title="Carbon Charts Svelte"
                  subtitle="25+ charts, powered by d3"
                  target="_blank"
                  href="https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte"
                />
              </Column>
            </Row>
            <Row noGutter>
              <Column xlg={5} lg={8} md={4}>
                <TileCard
                  title="Carbon Preprocess Svelte"
                  subtitle="Collection of Carbon Svelte preprocessors"
                  target="_blank"
                  href="https://github.com/carbon-design-system/carbon-preprocess-svelte"
                />
              </Column>
            </Row>
          </div>
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocFooterCta
    title="Start building with Carbon"
    description="Install the library, apply a theme, and compose your first screen in minutes."
  >
    <svelte:fragment slot="actions">
      <Stack orientation="horizontal" gap={4} align="center" wrap="wrap">
        <Button icon={ArrowRight} href="/quick-start">Get started</Button>
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
