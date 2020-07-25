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
    <p>
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
              code={`yarn add -D carbon-components-svelte`} />
          </TabContent>
          <TabContent>
            <CopyableCodeSnippet code={`npm -i -D carbon-components-svelte`} />
          </TabContent>
        </div>
      </Tabs>
    </p>
  </Column>
</Row>
<!-- 
<div style="margin-left: -1rem; margin-right: -1rem;">
  <Tabs type="container">
    <Tab label="Rapid Prototyping" />
    <Tab label="Single-Page Application (SPA)" />
    <Tab label="Server-side Rendered (SSR)" />
    <div slot="content" class="content">
      <TabContent>1</TabContent>
      <TabContent>2</TabContent>
      <TabContent>3</TabContent>
    </div>
  </Tabs>
</div>
 -->
