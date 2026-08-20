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

<SidePanel bind:open resizable title="Panel title" includeOverlay>
  <p>
    Drag the handle on the panel's inner edge to resize it, or double-click the
    handle to reset.
  </p>
</SidePanel>

<Content>
  <Grid>
    <Row>
      <Column>
        <Button on:click={() => (open = true)}>Open panel</Button>
      </Column>
    </Row>
  </Grid>
</Content>
