<script>
  import { Tabs, Tab, TabContent, Row, Column } from "carbon-components-svelte";
  import CopyableCodeSnippet from "../../components/CopyableCodeSnippet.svelte";
</script>

<style>
  .content {
    margin-left: -1rem;
    margin-top: -1rem;
  }
</style>

<svelte:head>
  <title>Getting Started</title>
</svelte:head>
<Row>
  <Column>
    <h1>Getting Started</h1>
    <p style="position: relative; z-index: 1;">
      <CopyableCodeSnippet type="inline" code="carbon-components-svelte" />
      can be installed as a development dependency.
    </p>
    <p>
      <Tabs type="container">
        <Tab label="Yarn" />
        <Tab label="NPM" />
        <div slot="content" class="content">
          <TabContent>
            <CopyableCodeSnippet
              code="{`yarn add -D carbon-components-svelte`}"
            />
          </TabContent>
          <TabContent>
            <CopyableCodeSnippet
              code="{`npm -i -D carbon-components-svelte`}"
            />
          </TabContent>
        </div>
      </Tabs>
    </p>
  </Column>
</Row>
