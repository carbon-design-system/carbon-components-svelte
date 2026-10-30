<script>
  import {
    Button,
    Content,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListRow,
    Tearsheet,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Content>
  <Button on:click={() => (open = true)}>View release</Button>
</Content>

<Tearsheet
  bind:open
  size="narrow"
  titleText="Release 2.14.0"
  descriptionText="Deployed to production on 12 October."
>
  <StructuredList>
    <StructuredListBody>
      <StructuredListRow>
        <StructuredListCell noWrap>Commit</StructuredListCell>
        <StructuredListCell>9f3c2ab</StructuredListCell>
      </StructuredListRow>
      <StructuredListRow>
        <StructuredListCell noWrap>Region</StructuredListCell>
        <StructuredListCell>US East</StructuredListCell>
      </StructuredListRow>
    </StructuredListBody>
  </StructuredList>
</Tearsheet>
