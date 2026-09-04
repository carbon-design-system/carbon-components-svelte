<script>
  import {
    ActionSet,
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
  title="Panel title"
  subtitle="Optional subtitle describing the panel's purpose."
  includeOverlay
>
  <p>Panel body content goes here.</p>

  <svelte:fragment slot="actions">
    <ActionSet>
      <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
      <Button on:click={() => (open = false)}>Save</Button>
    </ActionSet>
  </svelte:fragment>
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
