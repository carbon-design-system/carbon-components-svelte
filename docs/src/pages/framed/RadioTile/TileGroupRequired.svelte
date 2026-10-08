<script>
  import {
    Button,
    Form,
    RadioTile,
    Stack,
    TileGroup,
  } from "carbon-components-svelte";

  let submitted = false;
</script>

<Form
  on:submit={(e) => {
    e.preventDefault();
    submitted = true;
  }}
>
  <Stack gap={5}>
    <TileGroup required legendText="Region" name="region-required">
      <RadioTile value="us-east">US East</RadioTile>
      <RadioTile value="eu-west">EU West</RadioTile>
    </TileGroup>
    <div>
      <Button type="submit">Submit</Button>
    </div>
    {#if submitted}
      <p>Submitted.</p>
    {/if}
  </Stack>
</Form>
