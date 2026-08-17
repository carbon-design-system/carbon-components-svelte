<script>
  import {
    ActionSet,
    Button,
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    Row,
    SidePanel,
    SkipToContent,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs" />
  </HeaderNav>
</Header>

<SidePanel
  bind:open
  title="Cluster details"
  subtitle="mycluster-prod"
  includeOverlay
>
  <p>
    Docked alongside the header, a side panel works well for inspecting or
    editing a record without navigating away from the page underneath.
  </p>

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
        <Stack gap={6}>
          <h1>Clusters</h1>
          <Button on:click={() => (open = true)}>View details</Button>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Content>
