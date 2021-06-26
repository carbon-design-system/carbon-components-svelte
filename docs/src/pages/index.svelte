<script>
  import {
    Content,
    Grid,
    Row,
    Column,
    CodeSnippet,
    Link,
  } from "carbon-components-svelte";
  import TileCard from "../components/TileCard.svelte";
  import { metatags } from "@sveltech/routify";

  metatags.title = "Carbon Components Svelte";
  metatags.description =
    "The Svelte implementation of the Carbon Design System featuring UI components, icons, pictograms, and charts.";

  const installYarn = "yarn add -D carbon-components-svelte";
  const installNpm = "npm i -D carbon-components-svelte";
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
          component library that implements the Carbon Design System, an
          <Link
            inline
            class="big-link"
            href="https://www.carbondesignsystem.com/"
          >
            open source design system
          </Link>
          by IBM.
        </p>
        <p>
          Design systems facilitate design and development through reuse,
          consistency, and extensibility.
        </p>
      </Column>
    </Row>
    <Row style="margin-bottom: var(--cds-layout-02)">
      <Column>
        <h3>Install</h3>
        <h4>Installing with yarn:</h4>
        <CodeSnippet code="{installYarn}" />
        <h4>Using npm:</h4>
        <CodeSnippet code="{installNpm}" />
      </Column>
    </Row>
    <Row>
      <Column>
        <h3>Portfolio</h3>
        <p>
          The broader Carbon Svelte effort includes libraries for icons,
          pictograms, and data visualization.
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
          borderRight
          title="Carbon Pictograms Svelte"
          subtitle="700+ pictograms"
          target="_blank"
          href="https://github.com/IBM/carbon-pictograms-svelte"
        />
      </Column>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          title="Carbon Charts Svelte"
          subtitle="20 chart types, powered by d3"
          target="_blank"
          href="https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte"
        />
      </Column>
    </Row>
  </Grid>
</Content>
