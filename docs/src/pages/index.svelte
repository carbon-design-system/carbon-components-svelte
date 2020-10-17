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
  } from "carbon-components-svelte";
  import TileCard from "../components/TileCard.svelte";
  import { metatags } from "@sveltech/routify";
  import copy from "clipboard-copy";

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
          <code>carbon-components-svelte</code>
          is a
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
          A design system can facilitate frontend development and prototyping
          because it is encourages reuse, consistency, and extensibility.
        </p>
        <h3>Install</h3>
      </Column>
    </Row>
    <Row noGutter style="margin-bottom: var(--cds-layout-02)">
      <Column>
        <Tabs>
          <Tab label="Yarn" />
          <Tab label="npm" />
          <div
            slot="content"
            style="margin-left: calc(-1 * var(--cds-spacing-05)); margin-right: calc(-1 * var(--cds-spacing-05));"
          >
            <TabContent>
              <CodeSnippet
                code="{installYarn}"
                on:click="{() => {
                  copy(installYarn);
                }}"
              />
            </TabContent>
            <TabContent>
              <CodeSnippet
                code="{installNpm}"
                on:click="{() => {
                  copy(installNpm);
                }}"
              />
            </TabContent>
          </div>
        </Tabs>
      </Column>
    </Row>
    <Row>
      <Column>
        <h3>Portfolio</h3>
        <p>
          The broader Carbon Svelte effort extends to the icons, pictograms, and
          data visualization libraries.
        </p>
      </Column>
    </Row>
    <Row noGutter>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          borderRight
          borderBottom
          title="Carbon Components Svelte"
          subtitle="100+ components"
          target="_blank"
          href="https://github.com/IBM/carbon-components-svelte"
        />
      </Column>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          borderBottom
          title="Carbon Icons Svelte"
          subtitle="5000+ icons"
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
          subtitle="600+ pictograms"
          target="_blank"
          href="https://github.com/IBM/carbon-pictograms-svelte"
        />
      </Column>
      <Column xlg="{5}" lg="{8}" md="{4}">
        <TileCard
          title="Carbon Charts Svelte"
          subtitle="13 chart types, powered by d3"
          target="_blank"
          href="https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte"
        />
      </Column>
    </Row>
  </Grid>
</Content>
