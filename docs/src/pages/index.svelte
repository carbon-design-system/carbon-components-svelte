<script lang="ts">
  import {
    Column,
    Content,
    Grid,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import Apps from "carbon-icons-svelte/lib/Apps.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
  import Connect from "carbon-icons-svelte/lib/Connect.svelte";
  import ConnectionSignal from "carbon-icons-svelte/lib/ConnectionSignal.svelte";
  import DataStructured from "carbon-icons-svelte/lib/DataStructured.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import Popup from "carbon-icons-svelte/lib/Popup.svelte";
  import Replicate from "carbon-icons-svelte/lib/Replicate.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import Template from "carbon-icons-svelte/lib/Template.svelte";
  import Types from "carbon-icons-svelte/lib/Types.svelte";
  import DocBenefitGrid from "../components/DocBenefitGrid.svelte";
  import DocFooterCta from "../components/DocFooterCta.svelte";
  import DocHero from "../components/DocHero.svelte";
  import HomePageActions from "../components/HomePageActions.svelte";
  import DocMetric from "../components/DocMetric.svelte";
  import DocSection from "../components/DocSection.svelte";
  import DocSectionHeader from "../components/DocSectionHeader.svelte";
  import DocSplitRow from "../components/DocSplitRow.svelte";
  import TileCard from "../components/TileCard.svelte";

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

  const benefitSections = [
    { heading: "The Svelte way", items: apiBenefits },
    { heading: "Fast at scale", items: perfBenefits },
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
    description="A complete component library that implements the IBM Carbon Design System. Ship accessible, consistent, production-ready interfaces."
  >
    <svelte:fragment slot="title">
      <Text
        tag="h1"
        type="expressive-heading-06"
        color="primary"
        balance
        maxWidth="32ch"
      >
        The Carbon Design System,<br />built for Svelte
      </Text>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <HomePageActions />
    </svelte:fragment>
  </DocHero>

  <DocSection variant="metrics">
    <Grid>
      <Row>
        <Column>
          <div class="metrics-grid">
            <DocMetric
              value="70+"
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
        title="Engineered for Svelte"
        titleType="productive-heading-06"
        gap={6}
        maxWidth="62ch"
        wide
        balance
        description="Two-way bindings, slot composition, and compile-time reactivity keep the runtime small. Minimal boilerplate and performance tuned for data-heavy applications."
      />

      {#each benefitSections as section (section.heading)}
        <Row class="principle-row">
          <Column>
            <Stack gap={6}>
              <Text tag="h3" type="productive-heading-03" color="primary">
                {section.heading}
              </Text>
              <DocBenefitGrid items={section.items} />
            </Stack>
          </Column>
        </Row>
      {/each}
    </Grid>
  </DocSection>

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
                  subtitle="70+ components"
                  target="_blank"
                  href="https://github.com/carbon-design-system/carbon-components-svelte"
                />
              </Column>
              <Column xlg={5} lg={8} md={4}>
                <TileCard
                  borderBottom
                  title="Carbon Icons Svelte"
                  subtitle="2,600+ icons"
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
      <HomePageActions />
    </svelte:fragment>
  </DocFooterCta>
</Content>
