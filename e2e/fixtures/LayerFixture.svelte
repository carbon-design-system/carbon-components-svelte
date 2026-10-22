<script>
  import {
    Box,
    ContainedList,
    ContainedListItem,
    DataTable,
    Layer,
    TextInput,
    Tile,
  } from "carbon-components-svelte";

  const headers = [{ key: "name", value: "Name" }];
  const rows = [
    { id: "a", name: "Load balancer" },
    { id: "b", name: "Database" },
  ];
</script>

<div data-testid="level-1">
  <TextInput labelText="Workspace name" />
  <Tile>Usage this month</Tile>
  <Box fill="field">Billing contact</Box>
  <ContainedList labelText="Regions">
    <ContainedListItem>us-east-1</ContainedListItem>
  </ContainedList>
  <DataTable zebra size="compact" {headers} {rows} />
</div>

<Layer>
  <div data-testid="level-2">
    <TextInput labelText="Workspace name" />
    <Tile>Usage this month</Tile>
    <Box fill="field">Billing contact</Box>
    <ContainedList labelText="Regions">
      <ContainedListItem>us-east-1</ContainedListItem>
    </ContainedList>
    <DataTable zebra size="compact" {headers} {rows} />
  </div>

  <Layer>
    <div data-testid="level-3">
      <TextInput labelText="Workspace name" />
      <Tile>Usage this month</Tile>
      <Box fill="field">Billing contact</Box>
      <ContainedList labelText="Regions">
        <ContainedListItem>us-east-1</ContainedListItem>
      </ContainedList>
      <DataTable zebra size="compact" {headers} {rows} />
    </div>
  </Layer>
</Layer>
