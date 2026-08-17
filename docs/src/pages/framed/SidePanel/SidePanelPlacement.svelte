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

<SidePanel bind:open placement="left" title="Panel title" includeOverlay>
  <p>Docked to the left edge of the screen.</p>
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
