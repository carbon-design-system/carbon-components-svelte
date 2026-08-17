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

  const sizes = ["xs", "sm", "md", "lg", "xl", "2xl"];
  let open = false;
  let size = "md";

  function openWithSize(value) {
    size = value;
    open = true;
  }
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SidePanel bind:open {size} title="Panel title" includeOverlay>
  <p>Size: <strong>{size}</strong></p>
</SidePanel>

<Content>
  <Grid>
    <Row>
      <Column>
        {#each sizes as value}
          <Button kind="secondary" on:click={() => openWithSize(value)}>
            {value}
          </Button>
        {/each}
      </Column>
    </Row>
  </Grid>
</Content>
