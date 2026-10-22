<script>
  import {
    Box,
    ContainedList,
    ContainedListItem,
    Layer,
    TextInput,
    Tile,
  } from "carbon-components-svelte";
</script>

<div data-testid="level-1">
  <TextInput labelText="Workspace name" />
  <Tile>Usage this month</Tile>
  <Box fill="field">Billing contact</Box>
  <ContainedList labelText="Regions">
    <ContainedListItem>us-east-1</ContainedListItem>
  </ContainedList>
</div>

<Layer>
  <div data-testid="level-2">
    <TextInput labelText="Workspace name" />
    <Tile>Usage this month</Tile>
    <Box fill="field">Billing contact</Box>
    <ContainedList labelText="Regions">
      <ContainedListItem>us-east-1</ContainedListItem>
    </ContainedList>
  </div>

  <Layer>
    <div data-testid="level-3">
      <TextInput labelText="Workspace name" />
      <Tile>Usage this month</Tile>
      <Box fill="field">Billing contact</Box>
      <ContainedList labelText="Regions">
        <ContainedListItem>us-east-1</ContainedListItem>
      </ContainedList>
    </div>
  </Layer>
</Layer>
