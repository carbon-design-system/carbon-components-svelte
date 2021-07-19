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

  const installYarn = "yarn add -D carbon-components-svelte";
  const installNpm = "npm i -D carbon-components-svelte";
  const themes = {
    white: "White",
    g10: "Gray 10",
    g80: "Gray 80",
    g90: "Gray 90",
    g100: "Gray 100",
  };
  $: cssImport = `import "carbon-components-svelte/css/${$theme}.css";`;
  $: cssCdn = `<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/carbon-components-svelte/css/${$theme}.css"
    />
  </head>
</html>`;
</script>

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
      <Column>
        <h3>Installation</h3>
        <p>
          Install
          <code>carbon-components-svelte</code>
          as a development dependency in your project.
        </p>
        <h4>Using Yarn:</h4>
        <Row noGutter>
          <CodeSnippet code="{installYarn}" />
        </Row>
        <h4>Using NPM:</h4>
        <Row noGutter>
          <CodeSnippet code="{installNpm}" />
        </Row>
      </Column>
    </Row>
    <Row style="margin-bottom: var(--cds-layout-05)">
      <Column>
        <h3>Styling</h3>
        <p>
          Before importing components, you will need to first apply Carbon
          component styles. The Carbon Design System supports five themes (2
          light, 3 dark).
        </p>
        <RadioButtonGroup
          style="margin-top: var(--cds-spacing-08)"
          legendText="Carbon themes"
          bind:selected="{$theme}"
        >
          {#each ["white", "g10", "g80", "g90", "g100"] as value}
            <RadioButton labelText="{themes[value]}" value="{value}" />
          {/each}
        </RadioButtonGroup>
      </Column>
    </Row>

    <Row style="margin-bottom: var(--cds-layout-02)">
      <Column xlg="{10}" noGutter>
        <Tabs>
          <Tab label="CSS StyleSheet" />
          <Tab label="CDN" />
          <Tab label="SCSS" />
          <div slot="content">
            <TabContent>
              <p>
                This library ships with six pre-compiled CSS StyleSheets built
                from
                <OutboundLink
                  inline
                  size="lg"
                  href="https://github.com/carbon-design-system/carbon/tree/main/packages/components"
                >
                  carbon-components
                </OutboundLink>.
              </p>
              <Row padding noGutter>
                <Column>
                  <p>
                    <CodeSnippet type="single" code="{cssImport}" />
                  </p>
                </Column>
              </Row>
            </TabContent>
            <TabContent>
              <p>
                An alternative to loading styles is to link an external
                StyleSheet from a Content Delivery Network (CDN) like
                <OutboundLink inline size="lg" href="https://unpkg.com/">
                  unpkg.com
                </OutboundLink>.
              </p>
              <p>
                This is best suited for rapid prototyping or if your set-up does
                not use a CSS loader.
              </p>
              <Row padding noGutter>
                <Column>
                  <p>
                    <CodeSnippet type="multi" code="{cssCdn}" />
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
                  href="https://github.com/carbon-design-system/carbon/blob/main/docs/guides/sass.md"
                >
                  official Carbon guide on SASS
                </OutboundLink>
                for documentation.
              </p>
            </TabContent>
          </div>
        </Tabs>
      </Column>
    </Row>

    <Row>
      <Column>
        <h3>Portfolio</h3>
        <p>
          The Carbon Svelte portfolio includes packages for icons, pictograms,
          and data visualization.
        </p>
      </Column>
    </Row>
    <Row noGutter>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          borderRight
          borderBottom
          title="Carbon Components Svelte"
          subtitle="50+ components"
          target="_blank"
          href="https://github.com/IBM/carbon-components-svelte"
        />
      </Column>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          borderBottom
          title="Carbon Icons Svelte"
          subtitle="6000+ icons"
          target="_blank"
          href="https://github.com/IBM/carbon-icons-svelte"
        />
      </Column>
    </Row>
    <Row noGutter>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          borderBottom
          borderRight
          title="Carbon Pictograms Svelte"
          subtitle="700+ pictograms"
          target="_blank"
          href="https://github.com/IBM/carbon-pictograms-svelte"
        />
      </Column>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          borderBottom
          title="Carbon Charts Svelte"
          subtitle="20+ charts, powered by d3"
          target="_blank"
          href="https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte"
        />
      </Column>
    </Row>
    <Row noGutter>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          title="Carbon Preprocess Svelte"
          subtitle="Collection of Carbon Svelte preprocessors"
          target="_blank"
          href="https://github.com/IBM/carbon-preprocess-svelte"
        />
      </Column>
    </Row>
  </Grid>
</Content>

<style>
  p {
    margin-bottom: var(--cds-spacing-05);
  }
</style>
