<script>
  import {
    Button,
    CodeSnippet,
    Form,
    RadioTile,
    SelectableTile,
    SelectableTileGroup,
    Stack,
    TileGroup,
  } from "carbon-components-svelte";

  /** @type {null | string} */
  let submitted = null;
</script>

<Stack gap={7}>
  <Form
    on:submit={(e) => {
      e.preventDefault();
      const form = /** @type {HTMLFormElement} */ (e.currentTarget);
      const data = new FormData(form);
      // One value per radio group, one entry per selected tile.
      submitted = JSON.stringify(
        { plan: data.get("plan"), addons: data.getAll("addons") },
        null,
        2,
      );
    }}
  >
    <Stack gap={6}>
      <TileGroup legendText="Plan" name="plan" selected="team" required>
        <RadioTile value="starter">
          Starter: 3 projects, community support
        </RadioTile>
        <RadioTile value="team">
          Team: unlimited projects, email support
        </RadioTile>
        <RadioTile value="enterprise">
          Enterprise: SSO, dedicated support
        </RadioTile>
      </TileGroup>
      <SelectableTileGroup
        legendText="Add-ons"
        name="addons"
        selected={["backups"]}
      >
        <SelectableTile value="backups">Daily backups</SelectableTile>
        <SelectableTile value="audit">Audit log</SelectableTile>
        <SelectableTile value="sandbox">Sandbox environment</SelectableTile>
      </SelectableTileGroup>
      <Button type="submit">Show submitted values</Button>
    </Stack>
  </Form>

  {#if submitted}
    <CodeSnippet type="multi" code={submitted} />
  {/if}
</Stack>
