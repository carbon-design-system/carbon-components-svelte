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
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SidePanel bind:open title="Panel title" includeOverlay>
  <svelte:fragment slot="toolbar">
    <Button
      kind="ghost"
      size="small"
      icon={Filter}
      iconDescription="Filter"
      tooltipPosition="bottom"
    />
    <Button
      kind="ghost"
      size="small"
      icon={Settings}
      iconDescription="Settings"
      tooltipPosition="bottom"
    />
  </svelte:fragment>
  <p>Panel body content goes here.</p>
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
