<script>
  import {
    Content,
    Grid,
    Row,
    Column,
    CodeSnippet,
    Link,
    Tabs,
    Tab,
    TabContent,
    OutboundLink,
    RadioButtonGroup,
    RadioButton,
  } from "carbon-components-svelte";
  import TileCard from "../components/TileCard.svelte";
  import { theme } from "../store";
  import { metatags } from "@sveltech/routify";

  metatags.title = "Carbon Components Svelte";
  metatags.description =
    "The Svelte implementation of the Carbon Design System featuring UI components, icons, pictograms, and charts.";

  const installNpm = "npm i carbon-components-svelte";
  const installPnpm = "pnpm i carbon-components-svelte";
  const installYarn = "yarn add carbon-components-svelte";
  const installBun = "bun add carbon-components-svelte";
  const themes = {
    white: "White",
    g10: "Gray 10",
    g80: "Gray 80",
    g90: "Gray 90",
    g100: "Gray 100",
    all: "All",
  };

  const cssImportAll = `import "carbon-components-svelte/css/all.css";`;
  const cssThemeToggle = `<script>
  let theme = "${$theme}"; // "white" | "g10" | "g80" | "g90" | "g100"

  $: document.documentElement.setAttribute("theme", theme);
<\/script>
`;

  $: cssImport = `import "carbon-components-svelte/css/${$theme}.css";`;
</script>

<svelte:head>
  <link rel="canonical" href="https://svelte.carbondesignsystem.com/" />
</svelte:head>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>Carbon Components Svelte</h1>
        <p class="big-paragraph">
          Carbon Components Svelte is a
          <Link
            inline
            class="big-link"
            href="https://github.com/sveltejs/svelte"
          >
            Svelte
          </Link>
          component library that implements the
          <Link
            inline
            class="big-link"
            href="https://www.carbondesignsystem.com/"
          >
            Carbon Design System
          </Link>, an open source design system by IBM.
        </p>
        <p>
          Design systems facilitate design and development through reuse,
          consistency, and extensibility.
        </p>
      </Column>
    </Row>
    <Row style="margin-bottom: var(--cds-layout-02)">
      <Column max={10} xlg={10}>
        <h2 style="margin-top: var(--cds-layout-02)">Installation</h2>
      </Column>
    </Row>
    <Row style="margin-bottom: var(--cds-layout-02)">
      <Column noGutter>
        <Tabs autoWidth>
          <Tab label="NPM" />
          <Tab label="pnpm" />
          <Tab label="Yarn" />
          <Tab label="Bun" />
          <div slot="content" style="margin: 1rem -1rem">
            <TabContent>
              <CodeSnippet code={installNpm} />
            </TabContent>
            <TabContent>
              <CodeSnippet code={installPnpm} />
            </TabContent>
            <TabContent>
              <CodeSnippet code={installYarn} />
            </TabContent>
            <TabContent>
              <CodeSnippet code={installBun} />
            </TabContent>
          </div>
        </Tabs>
      </Column>
    </Row>
    <Row style="margin-bottom: var(--cds-layout-04)">
      <Column>
        <h2>Styling</h2>
        <p>
          Before importing components, you will need to first apply Carbon
          component styles. The Carbon Design System supports five themes (2
          light, 3 dark).
        </p>
        <RadioButtonGroup
          style="margin-top: var(--cds-spacing-08)"
          legendText="Carbon themes"
          bind:selected={$theme}
        >
          {#each ["white", "g10", "g80", "g90", "g100"] as value}
            <RadioButton labelText={themes[value]} {value} />
          {/each}
        </RadioButtonGroup>
      </Column>
    </Row>

    <Row>
      <Column max={8} xlg={8} noGutter>
        <Tabs autoWidth>
          <Tab label="CSS StyleSheet" />
          <Tab label="SCSS" />
          <svelte:fragment slot="content">
            <TabContent>
              <p>
                This library ships with six pre-compiled CSS StyleSheets built
                from
                <OutboundLink
                  inline
                  size="lg"
                  href="https://github.com/carbon-design-system/carbon/tree/main/packages/carbon-components"
                >
                  carbon-components
                </OutboundLink>.
              </p>
              <Row padding noGutter>
                <Column>
                  <p>
                    <CodeSnippet type="single" code={cssImport} />
                  </p>
                </Column>
              </Row>
            </TabContent>
            <TabContent>
              <p>
                The most performant method to load styles is to import SCSS
                directly from
                <code>carbon-components</code>. Although it requires more set
                up, you can reduce the size of the bundle CSS by importing
                individual component styles instead of a pre-compiled CSS
                StyleSheet.
              </p>
              <p>
                Refer to the
                <OutboundLink
                  inline
                  size="lg"
                  href="https://github.com/carbon-design-system/carbon/blob/v10/docs/guides/sass.md"
                >
                  official Carbon guide on SASS
                </OutboundLink>
                for documentation.
              </p>
            </TabContent>
          </svelte:fragment>
        </Tabs>
      </Column>
    </Row>

    <Row style="margin-bottom: var(--cds-layout-02)">
      <Column>
        <h2>Dynamic theming</h2>
        <p>Use the "all.css" StyleSheet for dynamic, client-side theming.</p>
        <Row padding noGutter>
          <Column>
            <p>
              <CodeSnippet type="single" code={cssImportAll} />
            </p>
          </Column>
        </Row>
        <p>
          Programmatically switch between each of the five Carbon themes by
          setting the "theme" attribute on the HTML element.
        </p>
        <Row padding noGutter>
          <Column>
            <p>
              <CodeSnippet type="multi" code={cssThemeToggle} />
            </p>
          </Column>
        </Row>
        <p>
          You can use the
          <Link inline size="lg" href="/components/Theme">
            Theme utility component
          </Link>
          to update the theme at runtime.
        </p>
      </Column>
    </Row>

    <Row style="margin-bottom: var(--cds-layout-02)">
      <Column>
        <h2>Portfolio</h2>
        <p>
          The Carbon Svelte portfolio includes packages for icons, pictograms,
          and data visualization.
        </p>
      </Column>
    </Row>
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
          subtitle="1,300+ pictograms"
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
  </Grid>
</Content>

<footer>
  <dds-footer-container disable-locale-button="true" size="micro" />
</footer>

<style>
  @media (min-width: 1056px) {
    footer {
      margin-left: 256px;
    }
  }

  p {
    margin-bottom: var(--cds-spacing-05);
  }
</style>
