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
    Tag,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SidePanel bind:open title="Smart summary" includeOverlay>
  <svelte:fragment slot="decorator">
    <Tag type="purple" size="sm">AI</Tag>
  </svelte:fragment>
  <p>Generated automatically from your latest activity.</p>
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
