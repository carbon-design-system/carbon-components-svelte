<script>
  import {
    Button,
    Column,
    Content,
    Grid,
    Header,
    Row,
    SidePanel,
    SkipToContent,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SidePanel
  bind:open
  slideIn
  selectorPageContent="#side-panel-slide-in-content"
  title="Panel title"
>
  <p>Panel body content goes here.</p>
</SidePanel>

<Content id="side-panel-slide-in-content">
  <Grid>
    <Row>
      <Column>
        <Button on:click={() => (open = true)}>Open panel</Button>
        <p>
          This content shrinks to make room for the panel instead of being
          covered by it.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
